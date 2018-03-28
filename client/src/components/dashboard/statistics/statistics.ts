import { Vue, Component, Watch} from 'vue-property-decorator';
import LineChart from './chart';

import './statistics.scss';
import { VueCharts, Bar, Line, mixins } from 'vue-chartjs';
import { JmxService } from '../../../services/jmxService';
import { StatesPrint, EngineStatus, EngineGroup } from '../../../models/engine';
import { ConnectionSettings } from '../../../models/connectionSettings';

const INT_15_MIN = 15 * 60 * 1000;
const INT_1_MIN = 60 * 1000;

@Component({
    template: require('./statistics.html'),
    services: ['jmxService'],
    components: {
        'line-chart': {
            extends: Line,
            mixins: [mixins.reactiveProp],
            props: ['chartData', 'options'],
            mounted () {
              this.renderChart(this.chartData, this.options);
            }
        },
    }
})
export class StatisticsComponent extends Vue {
    private jmxService: JmxService = this.$services.jmxService;
    multiEngine = false;
    id: string;
    group: EngineGroup = null;

    secondsKey = this.getKey('seconds');
    // secondsStates: StatesPrint[] = this.getDataFromLS('secondsStates');
    secondsStates: StatesPrint[] = this.getDataFromLS(this.secondsKey);
    secondsChartData = null;
    secondsInterval = null;
    
    minutesKey = this.getKey('minutes');
    // minutesStates: StatesPrint[] = this.getDataFromLS('minutesStates');
    minutesStates: StatesPrint[] = this.getDataFromLS(this.minutesKey);
    minutesChartData = null;
    minutesInterval = null;

    quoterKey = this.getKey('quoter');
    // quoterMinStates: StatesPrint[] = this.getDataFromLS('quoterMinStates');
    quoterMinStates: StatesPrint[] = this.getDataFromLS(this.quoterKey);
    quoterMinChartData = null;
    quoterMinInterval = null;

    states = {
        raw: true,
        waiting: true,
        finished: true,
        dequeued: true,
        error: true,
        invalid: true
    };

    mounted() { 
        this.initCharts();
    }
 
    @Watch('states', { deep: true })
    @Watch('$route.params')
    initCharts() {
        this.getId();
        this.getGroup();
        this.getKeySet();
        this.initSecondsChart();
        this.initMinutesChart();
        this.initQuoterMinChart();
    }

    destroyed() {
        if (this.secondsInterval) {
            clearInterval(this.secondsInterval);
        }
        if (this.minutesInterval) {
            clearInterval(this.minutesInterval);
        }
        if (this.quoterMinInterval) {
            clearInterval(this.quoterMinInterval);
        }
    }

    getKeySet() {
        this.secondsKey = this.getKey('seconds');
        this.minutesKey = this.getKey('minutes');
        this.quoterKey = this.getKey('quoter');
    }

    getKey(base: string) {
        if (this.id != null) {
            if (this.multiEngine === false) {
                return this.$store.state.connectionSettings.host + ':' 
                        + this.$store.state.connectionSettings.port + ':'
                        + this.$store.state.engineStatusList[this.id].engineId + ':' 
                        + base;
            } else {
                return this.$store.state.connectionSettings.host + ':' 
                        + this.$store.state.connectionSettings.port + ':'
                        + this.$route.params.id.substr(6) + ':' 
                        + base;
            }
        } else {
            return null;
        }
    }

    getId() {
        if (this.$route.params.id.substr(0, 5) === 'group') {
            console.log('detecting group');
            this.multiEngine = true;
            for (let i = 0; i < this.$store.state.groupsOfEngines.length; i++) {
                let group = this.$store.state.groupsOfEngines[i];
                if (this.parseGroupName(group.name) === this.$route.params.id.substr(6)) {
                    this.id = group.engines[0].id;
                }
            }
        } else {
            this.multiEngine = false;
            this.id = this.$route.params.id;
        }
    }

    getGroup() {
        if (this.multiEngine === true) {
            for (let i = 0; i < this.$store.state.groupsOfEngines.length; i++) {
                let group = this.$store.state.groupsOfEngines[i];
                if (this.parseGroupName(group.name) === this.$route.params.id.substr(6)) {
                    this.group = group;
                }
            }
        } else {
            return null;
        }
    }

    parseGroupName(rawName: string) {
        return rawName.substr(15);
    }

    getDataFromLS(key: string) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (err) {
            return [];    
        }
    }

    initSecondsChart() {
        if (this.secondsInterval) {
            clearInterval(this.secondsInterval);
        }
        let updateSecondsState = (states) => {
            // localStorage.setItem('secondsStates', JSON.stringify(states));
            localStorage.setItem(this.secondsKey, JSON.stringify(states));
            this.secondsChartData = this.getChartData(states);
        };
        console.log('this.secondsStates', this.secondsStates);
        this.fetchingData(this.secondsStates, updateSecondsState);
        this.secondsInterval = setInterval(() => {
            console.log('this.secondsStates', this.secondsStates);
            this.fetchingData(this.secondsStates, updateSecondsState);
        // }, (this.$store.state.connectionSettings as ConnectionSettings).updatePeriod * 1000);
        }, 2000);        
    }

    initMinutesChart() {
        if (this.minutesInterval) {
            clearInterval(this.minutesInterval);
        }
        let updateMinutesState = (states) => {
            // localStorage.setItem('minutesStates', JSON.stringify(states));
            localStorage.setItem(this.minutesKey, JSON.stringify(states));
            this.minutesChartData = this.getChartData(states);
        };
        this.fetchingData(this.minutesStates, updateMinutesState);
        this.minutesInterval = setInterval(() => {
            this.fetchingData(this.minutesStates, updateMinutesState);
        }, INT_1_MIN);
    }

    initQuoterMinChart() {
        if (this.quoterMinInterval) {
            clearInterval(this.quoterMinInterval);
        }
        let updateQuoterMinState = (states) => {
            // localStorage.setItem('quoterMinStates', JSON.stringify(states));
            localStorage.setItem(this.quoterKey, JSON.stringify(states));
            this.quoterMinChartData = this.getChartData(states);
        };
        this.fetchingData(this.quoterMinStates, updateQuoterMinState);
        this.quoterMinInterval = setInterval(() => {
            this.fetchingData(this.quoterMinStates, updateQuoterMinState);
        }, INT_15_MIN);
    }

    fetchingData(states: StatesPrint[], updateFn) {
        if (this.secondsInterval !== null) {
            if (this.multiEngine === false) {
                this.jmxService.getChartCounts(this.$store.state.connectionSettings, this.$store.state.mbeans.engineMBeans[this.id].name, this.$store.state.user).then((newStates: StatesPrint) => {
                    if (states.length > 10) {
                        states.shift();
                    }
                    states.push(newStates);
                    updateFn(states);
                });
            } else {
                this.jmxService.getGroupChartCounts(this.$store.state.connectionSettings, this.getBeans(), this.$store.state.user).then((response) => {
                    let counter = this.getCounter();
                    let running = 0;
                    let dequeued = 0;
                    let otherValues = [];

                    if (states.length > 10) {
                        states.shift();
                    }

                    for (let i = 0; i < counter; i++) {
                        running = running + response.data[i].value;
                    }
                    for (let i = counter; i < (counter * 2); i++) {
                        dequeued = dequeued + response.data[i].value;
                    }
                    for (let i = (counter * 2); i < response.data.length; i++) {
                        otherValues.push(response.data[i].value);
                    }

                    let newStates = new StatesPrint(new Date(response.data[0].timestamp * 1000), 
                        running, otherValues[0], otherValues[1], dequeued, otherValues[2], otherValues[3]);
                    states.push(newStates);
                    updateFn(states);
                });
            }
        }
    }

    getCounter() {
        for (let i = 0; i < this.$store.state.groupsOfEngines.length; i++) {
            let group = this.$store.state.groupsOfEngines[i];
                if (this.parseGroupName(group.name) === this.$route.params.id.substr(6)) {
                    return group.engines.length;
                }
        }
    }

    getBeans() {
        // for (let i = 0; i < this.$store.state.groupsOfEngines.length; i++) {
        //     let group = this.$store.state.groupsOfEngines[i];
        //         if (this.parseGroupName(group.name) === this.$route.params.id.substr(6)) {
        //             let beans = group.engines.map((engine) => {
        //                 return this.$store.state.mbeans.engineMBeans[engine.id].name;
        //             });
        //             return beans;
        //         }
        // }
        let beans = this.group.engines.map((engine) => {
            return this.$store.state.mbeans.engineMBeans[engine.id].name;
        });
        return beans;
    }

    getChartData(statesPrint: StatesPrint[]) {
        // console.log('states:', this.states);
        let dataset = [];
        if (statesPrint) { 
            if (this.states.raw) {
                dataset.push({
                    label: 'RAW',
                    backgroundColor: '#41ce00c4', // green
                    data: statesPrint.map((state) => state ? state.raw : 0)
                });
            }
            if (this.states.waiting) {
                dataset.push({
                    label: 'WAITING',
                    backgroundColor: '#e4c200de', // yellow
                    data: statesPrint.map((state) => state ? state.waiting : 0)
                });
            }
            if (this.states.finished) {
                dataset.push({
                    label: 'FINISHED',
                    backgroundColor: '#1ad8b9c4',  // grey
                    data: statesPrint.map((state) => state ? state.finished : 0)
                });
            }
            if (this.states.dequeued) {
                dataset.push({
                    label: 'DEQUEUED',
                    backgroundColor: '#0b7babc4',  // blue
                    data: statesPrint.map((state) => state ? state.dequeued : 0)
                });
            }
            if (this.states.error) {
                dataset.push({
                    label: 'ERROR',
                    backgroundColor: '#de1515c4',  // red
                    data: statesPrint.map((state) => state ? state.error : 0)
                });
            }
            if (this.states.invalid) {
                dataset.push({
                    label: 'INVALID',
                    backgroundColor: '#770202c4',  // dark red
                    data: statesPrint.map((state) => state ? state.invalid : 0)
                });
            }
        }

        return {
            labels: statesPrint ? statesPrint.map((state) => state ? (Vue as any).moment(state.time).format('HH:mm:ss') : 'NA') : [],
            datasets: dataset
        };
  }
}
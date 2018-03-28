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
    id: string;
    group: EngineGroup = null;

    secondsKey = this.getKey('seconds');
    secondsStates: StatesPrint[] = this.getDataFromLS(this.secondsKey);
    secondsChartData = null;
    secondsInterval = null;
    
    minutesKey = this.getKey('minutes');
    minutesStates: StatesPrint[] = this.getDataFromLS(this.minutesKey);
    minutesChartData = null;
    minutesInterval = null;

    quoterKey = this.getKey('quoter');
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
        this.saveStates();
        this.getGroup();
        this.getId();
        this.getKeySet();
        this.loadStates();
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

    saveStates() {
        localStorage.setItem(this.secondsKey, JSON.stringify(this.secondsStates));
        localStorage.setItem(this.minutesKey, JSON.stringify(this.minutesStates));
        localStorage.setItem(this.quoterKey, JSON.stringify(this.quoterMinStates));
        this.secondsStates = [];
        this.minutesStates = [];
        this.quoterMinStates = [];
    }

    loadStates() {
        this.secondsStates = this.getDataFromLS(this.secondsKey);
        this.minutesStates = this.getDataFromLS(this.minutesKey);
        this.quoterMinStates = this.getDataFromLS(this.quoterKey);  
    }

    getKeySet() {
        this.secondsKey = this.getKey('seconds');
        this.minutesKey = this.getKey('minutes');
        this.quoterKey = this.getKey('quoter');
    }

    getKey(base: string) {
        if (this.id != null) {
            if (this.group != null) {
                return this.$store.state.connectionSettings.host + ':' 
                    + this.$store.state.connectionSettings.port + ':'
                    + this.$route.params.id.substr(6) + ':' 
                    + base;
            } else {
                return this.$store.state.connectionSettings.host + ':' 
                    + this.$store.state.connectionSettings.port + ':'
                    + this.$store.state.engineStatusList[this.id].engineId + ':'
                    + this.$store.state.engineStatusList[this.id].id + ':'
                    + base;
            }
        } else {
            return null;
        }
    }

    getId() {
        if (this.group != null) {
            console.log('detecting group');
            this.id = String(this.group.engines[0].id);
        } else {
            this.id = this.$route.params.id;
        }
    }

    getGroup() {
        if (this.$route.params.id.substr(0, 5) === 'group') {
            for (let i = 0; i < this.$store.state.groupsOfEngines.length; i++) {
                let group = this.$store.state.groupsOfEngines[i];
                if (this.parseGroupName(group.name) === this.$route.params.id.substr(6)) {
                    this.group = group;
                }
            }
        } else {
            this.group = null;
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
            localStorage.setItem(this.secondsKey, JSON.stringify(states));
            this.secondsChartData = this.getChartData(states);
        };
        this.fetchingData(this.secondsStates, updateSecondsState);
        this.secondsInterval = setInterval(() => {
            this.fetchingData(this.secondsStates, updateSecondsState);
        }, 2000);        
    }

    initMinutesChart() {
        if (this.minutesInterval) {
            clearInterval(this.minutesInterval);
        }
        let updateMinutesState = (states) => {
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
            if (states.length > 10) {
                states.shift();
            }
            if (this.group === null) {
                this.jmxService.getChartCounts(this.$store.state.connectionSettings, this.$store.state.mbeans.engineMBeans[this.id].name, this.$store.state.user).then((newStates: StatesPrint) => {   
                    states.push(newStates);
                    updateFn(states);
                });
            } else {
                this.jmxService.getGroupChartCounts(this.$store.state.connectionSettings, this.getBeans(), this.group.engines.length, this.$store.state.user).then((newStates: StatesPrint) => {
                    states.push(newStates);
                    updateFn(states);
                });
            }
        }
    }

    getBeans() {
        return this.group.engines.map((engine) => {
            return this.$store.state.mbeans.engineMBeans[engine.id].name;
        });
    }

    getChartData(statesPrint: StatesPrint[]) {
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
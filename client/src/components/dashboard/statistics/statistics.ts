import { Vue, Component, Watch} from 'vue-property-decorator';
import LineChart from './chart';

import './statistics.scss';
import { VueCharts, Bar, Line, mixins } from 'vue-chartjs';
import { JmxService } from '../../../services/jmxService';
import { StatesPrint, EngineStatus } from '../../../models/engine';
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
    secondsStates: StatesPrint[] = this.getDataFromLS('secondsStates');
    secondsChartData = null;
    secondsInterval = null;
    
    minutesStates: StatesPrint[] = this.getDataFromLS('minutesStates');
    minutesChartData = null;
    minutesInterval = null;

    quoterMinStates: StatesPrint[] = this.getDataFromLS('quoterMinStates');
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

    getDataFromLS(key: string) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (err) {
            return [];    
        }
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

    mounted() {
       this.initCharts();
    }

    @Watch('states', { deep: true })
    @Watch('$route.params')
    initCharts() {
        this.initSecondsChart();
        this.initMinutesChart();
        this.initQuoterMinChart();
    }

    initSecondsChart() {
        if (this.secondsInterval) {
            clearInterval(this.secondsInterval);
        }
        let updateSecondsState = (states) => {
            localStorage.setItem('secondsStates', JSON.stringify(states));
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
            localStorage.setItem('minutesStates', JSON.stringify(states));
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
            localStorage.setItem('quoterMinStates', JSON.stringify(states));
            this.quoterMinChartData = this.getChartData(states);
        };
        this.fetchingData(this.quoterMinStates, updateQuoterMinState);
        this.quoterMinInterval = setInterval(() => {
            this.fetchingData(this.quoterMinStates, updateQuoterMinState);
        }, INT_15_MIN);
    }

    fetchingData(states: StatesPrint[], updateFn) {
        this.jmxService.getChartCounts(this.$store.state.connectionSettings, this.$store.state.mbeans.engineMBeans[this.$route.params.id], this.$store.state.user).then((newStates: StatesPrint) => {
            if (states.length > 10) {
                states.shift();
            }
            states.push(newStates);
            updateFn(states);
        });
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
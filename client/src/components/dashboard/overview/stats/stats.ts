import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { StatesPrint, ChartStates, EngineGroup, EngineStatus } from '../../../../models/engine';
import { VueCharts, Bar, Line, mixins } from 'vue-chartjs';
import { EngineStatData } from '../index';
import './stats.scss';

@Component({
    template: require('./stats.html'),
    components: {
        'line-chart': {
            extends: Line,
            mixins: [mixins.reactiveProp],
            props: ['chartData', 'options'],
            mounted () {
              this.renderChart(this.chartData, this.options);
            }
        }
    }
})

export class Stats extends Vue {
    @Prop() dataset;
    private eventHub: Vue = this.$services.eventHub;
    chartData = null;
    chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0, // general animation time
            // easing: 'easeInCirc'
        },
        elements: {
            line: {
                tension: 0, // disables bezier curves
            
            },
        }
    };

    mounted() {
        this.update();
    }

    @Watch('dataset')
    update() {
        this.chartData = this.dataset;
    }
}
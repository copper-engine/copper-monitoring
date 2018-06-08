import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { StatesPrint, ChartStates, EngineGroup, EngineStatus } from '../../../../models/engine';
import { VueCharts, Bar, Line, mixins } from 'vue-chartjs';
import { EngineStatData } from '../../../../models/engine';
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
    // the order of values in chartOptions seems to have an effect
    // on the rendering of charts, search for official documentation
    // and examples when adding new options
    chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            xAxes: [{
                stacked: false,
                beginAtZero: true,
                scaleLabel: {
                    labelString: 'Time'
                },
                ticks: {
                    stepSize: 1,
                    min: 0,
                    autoSkip: false
                }
            }]
        },
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
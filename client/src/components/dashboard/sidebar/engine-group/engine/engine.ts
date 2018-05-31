import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { JmxService } from '../../../../../services/jmxService';
import './engine.scss';
import { Link } from '../../../../../models/link';
import { EngineStatus, WorkflowFilter, State } from '../../../../../models/engine';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
import { MBean } from '../../../../../models/mbeans';

@Component({
    template: require('./engine.html'),
})
export class EngineComponent extends Vue {
    private jmxService: JmxService = this.$services.jmxService;
    @Prop() status: EngineStatus;
    @Prop() multiEngine: boolean;
    @Prop() closing: boolean;
    open: boolean = false;
    wfCount: number = 0;
    clickAllowed = true;
    filter: WorkflowFilter;
    mbean: MBean;

    mounted() {
        this.filter = new WorkflowFilter;
        this.filter.states = [State.RUNNING];                
        this.mbean = this.$store.getters.engineMBeans[this.status.id];  
        this.getWFCount();

    }

    @Watch('closing')
    close() {
        if (this.closing === true) {
            this.open = false;
        }
    }

    @Watch('status')
    getWFCount() {
        this.jmxService.countWFRequest(this.mbean.connectionSettings, this.mbean.name, this.$store.state.user, this.filter).then((response: number) => {
            this.wfCount = response;
        });
     }

    openEngine() {
        if (this.clickAllowed === true) {
            this.open = !this.open;
            this.clickAllowed = false;
            setTimeout(() => { 
                this.clickAllowed = true;
            }, 1000);
        }
    }

    get connection() {
        return this.$store.getters.engineMBeans[this.status.id].connectionSettings;
    }

    get extendTypeOfEngine() {
        if (this.multiEngine === true) {
            return 'extend-engine-limited';
        } else if (this.status.type === 'persistent') {
            return 'extend-engine-persistent';
        } else {
            return 'extend-engine-tranzient';
        }
    }

    get links(): Link[] {
        let linkArray = [];
        let params = this.status.id + '?' + this.$store.getters.connectionsAsParams;
        // if (!this.multiEngine) {
        //     linkArray = linkArray.concat([
        //         new Link('Statistics', '/dashboard/statistics/engine/' + params, 'mdi-chart-bar')
        //     ]);
        // }
        if (!this.multiEngine) {
            if (this.status.type === 'persistent') {
                linkArray = linkArray.concat([
                    new Link('Broken Workflows', '/dashboard/workflows/broken/' + params, 'mdi-image-broken')
                ]);
            }
            linkArray = linkArray.concat([
                new Link('Waiting Workflows', '/dashboard/workflows/waiting/' + params, 'mdi-timer-sand-empty')
            ]);
        }
        
        return linkArray.concat([
            new Link('Workflow Repository', '/dashboard/workflow-repo/' + params, 'mdi-file'),
            new Link('Processor Pools', '/dashboard/processor-pools/' + params, 'mdi-server')
        ]);
    }
}
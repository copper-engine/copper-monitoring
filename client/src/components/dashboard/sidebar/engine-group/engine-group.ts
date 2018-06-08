import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { EngineGroup, EngineStatus, WorkflowFilter, State } from '../../../../models/engine';
import { JmxService } from '../../../../services/jmxService';
import { Link } from '../../../../models/link';
import './engine-group.scss';

const EngineComponent = () => import('./engine').then(({ EngineComponent }) => EngineComponent);

@Component({
    template: require('./engine-group.html'),
    components: {
        'engine': EngineComponent
    }
})
export class EngineGroupComponent extends Vue {
    private jmxService: JmxService = this.$services.jmxService;
    @Prop() group: EngineGroup;
    @Prop() closing: boolean;
    brokenWFCount = 0;
    wfCount = 0;
    open: boolean = false;
    multiEngine: boolean = false;
    mbean = null;
    clickAllowed = true;

    created() {
        this.checkGroupInfo();
    }
    
    @Watch('group')
    checkGroupInfo() {
        if (this.group.engines.length > 1) {
            this.multiEngine = true;
        }
        this.getBrokenWFCount();
        this.getGroupWFCount();
    }
    
    @Watch('closing')
    close() {
        if (this.closing === true) {
            this.open = false;
        }
    }

    private openGroup() {
        if (this.clickAllowed === true) {
            this.open = !this.open;
            this.clickAllowed = false;
            setTimeout(() => { 
                this.clickAllowed = true;
            }, 1000);
        }
    }
    
    private getBrokenWFCount() {
        this.mbean = this.$store.getters.engineMBeans[this.group.engines[0].id];
        this.jmxService.countWFRequest(this.mbean.connectionSettings, this.mbean.name, this.$store.state.user, new WorkflowFilter).then((response: number) => {
            this.brokenWFCount = response;
        });
    }
    private getGroupWFCount() {
        let state = State.RUNNING;
        let beans = this.group.engines.map((engine) => {
            return this.$store.getters.engineMBeans[engine.id];
        });
        this.jmxService.countGroupWFRequest(beans, beans.length, this.$store.state.user, state).then((response: any) => {
            this.wfCount = response;
        });
        
     }

     private get links(): Link[] {
        let params = '?' + this.$store.getters.connectionsAsParams;
        
        return [
            // new Link('Statistics', '/dashboard/statistics/' + ('group:' + this.group.name) + '/' + this.group.engines[0].id + params, 'mdi-chart-bar'),
            new Link('Broken Workflows', '/dashboard/workflows/broken/' + this.group.engines[0].id + params, 'mdi-image-broken'),
            new Link('Waiting Workflows', '/dashboard/workflows/waiting/' + this.group.engines[0].id + params, 'mdi-timer-sand-empty')
        ];
    }
}
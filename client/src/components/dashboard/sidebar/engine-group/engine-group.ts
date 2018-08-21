import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { EngineGroup, EngineStatus, WorkflowFilter, State } from '../../../../models/engine';
import { JmxService } from '../../../../services/jmxService';
import { Link } from '../../../../models/link';
import './engine-group.scss';
import { MBean } from '../../../../models/mbeans';

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
        let mbean = this.group.engines[0].engineMXBean;
        this.jmxService.countWFRequest(mbean.connectionSettings, mbean.name, this.$store.state.user, new WorkflowFilter).then((response: number) => {
            this.brokenWFCount = response;
        });
    }
    
    private getGroupWFCount() {
        let state = State.RUNNING;
        let beans = this.group.engines.map((engine) => {
            return engine.engineMXBean;
        });
        this.jmxService.countGroupWFRequest(beans, beans.length, this.$store.state.user, state).then((response: any) => {
            this.wfCount = response;
        });
        
     }

     private get links(): Link[] {
        let params = this.group.engines[0].id + '?' + this.$store.getters.connectionsAsParams;
        
        return [
            new Link('Broken Workflows', '/dashboard/workflows/broken/' + params, 'mdi-image-broken'),
            new Link('Waiting Workflows', '/dashboard/workflows/waiting/' + params, 'mdi-timer-sand-empty')
        ];
    }

    getName(mbean: MBean) {
            return mbean.connectionSettings.host + mbean.connectionSettings.port;
    }
}
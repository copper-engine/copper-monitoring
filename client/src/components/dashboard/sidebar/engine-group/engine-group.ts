import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { EngineGroup, EngineStatus, WorkflowFilter } from '../../../../models/engine';
import { JmxService } from '../../../../services/jmxService';
import { Link } from '../../../../models/link';

const statusComponent = () => import('./status').then(({ StatusComponent }) => StatusComponent);

@Component({
    template: require('./engine-group.html'),
    components: {
        'status': statusComponent
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

    parseGroupName(rawName: string) {
        if (rawName) {
            return rawName.substr(15);
        } else {
            return 'noname';
        }
    }

    created() {
        this.checkGroupInfo();
    }
    
    @Watch('group')
    checkGroupInfo() {
        if (this.group.engines.length > 1) {
            this.multiEngine = true;
        }
        this.getBrokenWFCount();
        this.getWFCount();
    }
    
    @Watch('closing')
    close() {
        if (this.closing === true) {
            this.open = false;
        }
    }
    
    getBrokenWFCount() {
        this.mbean = this.$store.state.mbeans.engineMBeans[this.group.engines[0].id];
        this.jmxService.countWFRequest(this.mbean.connectionSettings, this.mbean.name, this.$store.state.user, new WorkflowFilter).then((response: number) => {
            this.brokenWFCount = response;
        });
    }
    getWFCount() {
        let count = 0;
        for (let i = 0; i < this.group.engines.length; i++) {
            count = count + this.group.engines[i].instances;
        }
        this.wfCount = count;
     }

    get links(): Link[] {
        let params = '?' + this.$store.getters.connectionsAsParams;
        
        return [
            new Link('Statistics', '/dashboard/statistics/' + ('group:' + this.parseGroupName(this.group.name)) + params, 'mdi-chart-bar'),
            new Link('Broken Workflows', '/dashboard/workflows/' + this.group.engines[0].id + params, 'mdi-image-broken'),
            new Link('Waiting Workflows', '/dashboard/waiting-workflows/' + this.group.engines[0].id + params, 'mdi-timer-sand-empty')
        ];
    }
}
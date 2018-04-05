import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { EngineGroup, EngineStatus, WorkflowFilter } from '../../../../models/engine';
import { JmxService } from '../../../../services/jmxService';
import { Link } from '../../../../models/link';
import './engine-group.scss';

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

    created() {
        this.checkGroupInfo();
    }

    parseGroupName(rawName: string) {
        return rawName.substr(15);
    }

    getBrokenWFCount() {
       this.jmxService.countWFRequest(this.$store.state.connectionSettings, this.$store.state.mbeans.engineMBeans[this.group.engines[0].id].name, this.$store.state.user, new WorkflowFilter).then((response: number) => {
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
        
        return [
            new Link('Statistics', '/dashboard/statistics/' + ('group:' + this.parseGroupName(this.group.name)) + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-chart-bar'),
            new Link('Broken Workflows', '/dashboard/workflows/' + ('broken:' + this.group.engines[0].id) + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-image-broken'),
            new Link('Waiting Workflows', '/dashboard/workflows/' + ('waiting:' + this.group.engines[0].id) + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-timer-sand-empty')
        ];
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

}
import { Vue, Component, Watch} from 'vue-property-decorator';
import { ConnectionSettings } from '../../../models/connectionSettings';
import { WorkflowInfo, WorkflowFilter, State } from '../../../models/engine';
import { JmxService } from '../../../services/jmxService';
import { User } from '../../../models/user';
import './waiting-workflows.scss';
@Component({
    template: require('./waiting-workflows.html')
})
export class WaitingWorkflows extends Vue {
    private jmxService: JmxService = this.$services.jmxService;
    fetchWaitingWFInterval: any;
    page: number = 1;
    perPage: number = 10;
    perPageItems: number[] = [10, 15, 25, 50];
    newComponent = false;
    wfCount: number = 0;
    workflows: WorkflowInfo[] = [];
    filter: WorkflowFilter;

    mounted() {
        this.filter = new WorkflowFilter;
        this.filter.states = [State.WAITING];
        this.sheduleFetchingWaitingWF();
    }
    beforeDestroy() {
        clearInterval(this.fetchWaitingWFInterval);
    }

    private getWaitingWorkflows(connectionSettings: ConnectionSettings, user: User, filter) {
        this.jmxService.countWFRequest(this.$store.state.connectionSettings, this.$store.state.mbeans.engineMBeans[this.$route.params.id].name, this.$store.state.user, this.filter).then((response: number) => {
            this.wfCount = response;
        });
        this.jmxService.getBrokenWorkflows(connectionSettings, this.$store.state.mbeans.engineMBeans[this.$route.params.id].name, user, this.perPage, (this.page - 1) * this.perPage, filter).then((response: WorkflowInfo[]) => {
            this.workflows = response;
        });
    }
    
    @Watch('$store.state.connectionSettings')
    sheduleFetchingWaitingWF() {
        if (this.fetchWaitingWFInterval) {
            clearInterval(this.fetchWaitingWFInterval);
        }
        this.getWaitingWorkflows(this.$store.state.connectionSettings, this.$store.state.user, this.filter);
        this.fetchWaitingWFInterval = setInterval(() => {
            this.getWaitingWorkflows(this.$store.state.connectionSettings, this.$store.state.user, this.filter);
        }, this.$store.state.connectionSettings.updatePeriod * 1000);
    }

    @Watch('page')
    @Watch('perPage')
    private forceStatusFetch(delay: number = 0) {
        setTimeout(() => {
            this.getWaitingWorkflows(this.$store.state.connectionSettings, this.$store.state.user, this.filter);
        }, delay);
    }

    @Watch('$route')
    newPage() {
        this.newComponent = true;
        setTimeout(() => {
            this.newComponent = false;
        }, 200);
        this.workflows = [];
        this.wfCount = 0;
        this.filter = new WorkflowFilter;
        this.getWaitingWorkflows(this.$store.state.connectionSettings, this.$store.state.user, this.filter);
    }

}
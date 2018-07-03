import { Vue, Component, Watch} from 'vue-property-decorator';
import { WorkflowRepo, EngineStatus } from '../../../models/engine';
import { JmxService } from '../../../services/jmxService';
import { parseSourceCode } from '../../../util/utils';
import './workflow-repo.scss';
import { setTimeout } from 'timers';

const sourceCodeComponent = () => import('./../../core/source-code').then(({ SourceCodeComponent }) => SourceCodeComponent);
@Component({
    template: require('./workflow-repo.html'),
    components: {
        'source-code': sourceCodeComponent,
    }
})
export class WorkflowRepository extends Vue {

    private jmxService: JmxService = this.$services.jmxService;
    newComponent = false;
    wfRepo: WorkflowRepo = new WorkflowRepo();
    page: number = 1;
    perPage: number = 10;
    perPageItems: number[] = [10, 15, 25, 50];
    clickAllowed: boolean = true;
    fetchInterval;

    created() {
        this.loadRepo();
    }

    mounted() {
        this.scheduleFetchingInterval();
    }

    beforeDestroy() {
        clearInterval(this.fetchInterval);
    }
    
    @Watch('$route.params')
    loadRepo() {
        this.newComponent = true;
        setTimeout(() => {
            this.newComponent = false;
        }, 200);
        this.wfRepo = new WorkflowRepo();
        let engine: EngineStatus = this.$store.state.engineStatusList[this.$route.params.id];
        let mbean = this.$store.getters.engineMBeans[this.$route.params.id];
        // this.wfRepo =  new WorkflowRepo();
        this.jmxService.getWfRepo(mbean.connectionSettings, engine.wfRepoMXBean, this.$store.state.user).then((response: WorkflowRepo) => {
            this.wfRepo = response;
        });
    }

    @Watch('$store.state.connectionSettings')
    scheduleFetchingInterval() {
        if (this.fetchInterval) {
            clearInterval(this.fetchInterval);
        }
        this.loadRepo();
        this.fetchInterval = setInterval(() => {
            this.loadRepo();
        }, 2 * 1000);
    }
    
    private toggleOpen(index) {
        if (this.clickAllowed === true) {
            this.clickAllowed = false;
            this.wfRepo.workFlowInfo[index].open = !this.wfRepo.workFlowInfo[index].open;
            this.$forceUpdate();
            setTimeout(() => {
                this.clickAllowed = true;
            }, 750);
        } 
    }

    private get totalPages() {
        if (this.wfRepo.workFlowInfo.length > 0) {
             let total = Math.ceil(this.wfRepo.workFlowInfo.length / this.perPage);
             if (this.page > total) {
                 this.page = 1;
             }
             return total;
        }
        this.page = 1;
        return 1;
    }
}
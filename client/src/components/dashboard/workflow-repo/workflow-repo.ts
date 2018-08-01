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
    wfRepo: WorkflowRepo = new WorkflowRepo();
    page: number = 1;
    perPage: number = 10;
    perPageItems: number[] = [10, 15, 25, 50];
    clickAllowed: boolean = true;
    newComponent: boolean = false;
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

    loadRepo() {              
        let engine: EngineStatus = this.$store.state.engineStatusList[this.$route.params.id];
        let mbean = this.$store.getters.engineMBean(this.$route.params.id);
        this.jmxService.getWfRepoDetails(mbean.connectionSettings, engine.wfRepoMXBean, this.$store.state.user).then((response: WorkflowRepo) => {
            this.wfRepo.description = response.description;
            this.wfRepo.sourceDir = response.sourceDir;
            this.wfRepo.lastBuildResults = response.lastBuildResults;
            this.wfRepo.repoSize = response.repoSize;
        });
        this.jmxService.getWfRepo(mbean.connectionSettings, engine.wfRepoMXBean, this.$store.state.user, this.perPage, (this.page - 1) * this.perPage).then((response) => {
            this.wfRepo.workFlowInfo = response;
        });
    }

    @Watch('page')
    @Watch('perPage')
    updatePaganation() {
        // before calling loadRepo() to update results based on a new 'perpage', we must
        // wait to make sure that 'page' has updated as per 'totalPages()', otherwise 
        // the query will fail. Once 'page' is updated this function will be re-called
        if (this.page <= Math.ceil(this.wfRepo.repoSize / this.perPage)) {
            this.scheduleFetchingInterval();
        }
    }

    @Watch('$route')
    newPage() {
        this.newComponent = true;
        setTimeout(() => {
            this.newComponent = false;
        }, 200);
        this.scheduleFetchingInterval();
    }


    @Watch('$store.state.connectionSettings')
    scheduleFetchingInterval() {
        if (this.fetchInterval) {
            clearInterval(this.fetchInterval);
        }
        this.loadRepo();
        this.fetchInterval = setInterval(() => {
            this.loadRepo();
        }, 60 * 1000);
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
        if (this.wfRepo && this.wfRepo.repoSize > 0) {
             let total = Math.ceil(this.wfRepo.repoSize / this.perPage);
             if (this.page > total) {
                 this.page = 1;
             }
             return total;
        }
        this.page = 1;
        return 1;
    }
}
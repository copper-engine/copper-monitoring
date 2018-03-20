import { Vue, Component, Watch} from 'vue-property-decorator';
import { WorkflowRepo, EngineStatus } from '../../../models/engine';
import { JmxService } from '../../../services/jmxService';
import { parseSourceCode } from '../../../util/utils';
import './workflow-repo.scss';

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

    created() {
        this.loadRepo();
    }
    
    @Watch('$route.params')
    loadRepo() {
        let engine: EngineStatus = this.$store.state.engineStatusList[this.$route.params.id];
        console.log('engine', engine);
        this.wfRepo =  new WorkflowRepo();
        this.jmxService.getWfRepo(this.$store.state.connectionSettings, engine.wfRepoMXBean, this.$store.state.user).then((response: WorkflowRepo) => {
            this.wfRepo = response;
        });
    }
    
    toggleOpen(index) {
        this.wfRepo.workFlowInfo[index].open = !this.wfRepo.workFlowInfo[index].open;
        this.$forceUpdate();
    }

    get totalPages() {
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
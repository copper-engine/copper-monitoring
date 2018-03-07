import { Vue, Component} from 'vue-property-decorator';
import { WorkflowRepo } from '../../../models/engine';
import { JmxService } from '../../../services/jmxService';
import { parseSourceCode } from '../../../util/utils';
import './workflowRepo.scss';

const sourceCodeomponent = () => import('./../../core').then(({ SourceCodeComponent }) => SourceCodeComponent);
@Component({
    template: require('./workflowRepo.html'),
    components: {
        'source-code': sourceCodeomponent,
    }
})
export class WorkflowRepository extends Vue {

    private jmxService: JmxService = this.$services.jmxService;

    wfRepo: WorkflowRepo = {
        description: '',
        sourceDir: '',
        workFlowInfo: []
    };

    page: number = 1;
    perPage: number = 10;
    perPageItems: number[] = [10, 15, 25, 50];

    created() {
        this.jmxService.getWfRepo(this.$store.state.connectionSettings, this.$store.state.mbeans, this.$store.state.user).then((response: WorkflowRepo) => {
            this.wfRepo = response;
            // this.wfRepo.workFlowInfo.map((workflow, index) => {
            //     this.wfRepo.workFlowInfo[index].sourceCode = parseSourceCode(workflow.sourceCode);
            //     this.wfRepo.workFlowInfo[index].sourceCodeLines = workflow.sourceCode.split('\n');
            // });
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
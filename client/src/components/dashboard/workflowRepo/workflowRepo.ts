import { Vue, Component} from 'vue-property-decorator';
import { WorkflowRepo } from '../../../models/engine';
import { JmxService } from '../../../services/jmxService';
import * as utils from '../../../util/utils';
import './workflowRepo.scss';

@Component({
    template: require('./workflowRepo.html')
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
        this.jmxService.getWfRepo(this.$store.state.connectionSettings, this.$store.state.user).then((response: WorkflowRepo) => {
            this.wfRepo = response;
            this.wfRepo.workFlowInfo.map((workflow, index) => {
                this.wfRepo.workFlowInfo[index].sourceCode = utils.parseSourceCode(workflow.sourceCode);
            });
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
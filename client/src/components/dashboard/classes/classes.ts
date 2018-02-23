import { Vue, Component} from 'vue-property-decorator';
import { WorkflowRepo } from '../../../models/engine';
import { JmxService } from '../../../services/jmxService';
import './classes.scss';

@Component({
    template: require('./classes.html')
})

export class Classes extends Vue {

    private jmxService: JmxService = this.$services.jmxService;

    wfType: String = '';
    wfSource: String = '';
    wfArray: any = [];

    page: number = 1;
    perPage: number = 10;
    perPageItems: number[] = [10, 15, 25, 50];

    created() {
        this.jmxService.getWfRepo(this.$store.state.connectionSettings, this.$store.state.user, this.$store.state.engineStatus.wfRepoMXBeanName).then((response: WorkflowRepo) => {
            this.wfArray = response.workFlowInfo;
            this.wfType = response.description;
            this.wfSource = response.sourceDir;
            this.wfArray[1].sourceCode = null;
        });
    }

    toggleOpen(index) {
        this.wfArray[index].open = !this.wfArray[index].open;
        this.$forceUpdate();
    }

    get totalPages() {
        if (this.wfArray.length > 0) {
             let total = Math.ceil(this.wfArray.length / this.perPage);
             if (this.page > total) {
                 this.page = 1;
             }
             return total;
        }
        this.page = 1;
        return 1;
    }

}
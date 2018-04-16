import { Vue, Component, Prop} from 'vue-property-decorator';
import { WorkflowInfo } from '../../../../models/engine';
import './workflow-details.scss';

@Component({
    template: require('./workflow-details.html')
})
export class WorkflowDetails extends Vue {
    @Prop() workflow: WorkflowInfo;
    @Prop() wfType: string;
    @Prop() inDialog: boolean;

    openWorkflowDialog(workflow: WorkflowInfo) {
        this.$emit('openWorkflowDialog', workflow);
    }
}
import { Vue, Component, Prop} from 'vue-property-decorator';
import { WorkflowInfo } from '../../../../models/engine';
import './workflow-details.scss';

import * as moment from 'moment';
import { create } from 'domain';

@Component({
    template: require('./workflow-details.html')
})
export class WorkflowDetails extends Vue {
    @Prop() workflow: WorkflowInfo;
    @Prop() wfType: string;
    @Prop() inDialog: boolean;

    openWorkflowDialog() {
        this.$emit('openWorkflowDialog', this.workflow);
    }

    showSourceCode() {
        this.$emit('showSourceCode', this.workflow);        
    }

    get creationTS() {
        if (this.workflow.creationTS !== null) {
            let creation = moment(this.workflow.creationTS).format('HH:mm DD/MM/YYYY');
            return creation;
        } else {
            return '';        }
    }
    get modTS() {
        if (this.workflow.lastModTS !== null) {
            return moment(this.workflow.lastModTS).format('HH:mm DD/MM/YYYY');
        } else {
            return '';        }
    }
    get errorTS() {
        if (this.workflow.errorData !== null && this.workflow.errorData !== undefined) {
            return moment(this.workflow.errorData.errorTS).format('HH:mm DD/MM/YYYY');
        } else {
            return '';        }
    }
}
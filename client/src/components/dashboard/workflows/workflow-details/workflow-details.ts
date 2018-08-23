import { Vue, Component, Prop} from 'vue-property-decorator';
import { WorkflowInfo, EngineStatus } from '../../../../models/engine';
import './workflow-details.scss';
import { JmxService } from '../../../../services/jmxService';
import * as moment from 'moment';
import { create } from 'domain';

@Component({
    template: require('./workflow-details.html')
})
export class WorkflowDetails extends Vue {
    @Prop() workflow: WorkflowInfo;
    @Prop() wfType: string;
    @Prop() engineStatus: EngineStatus;
    @Prop() inDialog: boolean;
    private jmxService: JmxService = this.$services.jmxService;

    private openWorkflowDialog() {
        this.$emit('openWorkflowDialog', this.workflow);
    }

    private showSourceCode() {
        this.$emit('showSourceCode', this.workflow);        
    }

    private queryState() {
        this.jmxService.queryObjectState(this.engineStatus.engineMXBean.connectionSettings, this.engineStatus.engineMXBean, this.$store.state.user, this.workflow.id)
        .then((response) => {
            this.$emit('showState', this.convertToState(response));
        });
    }

    private convertToState(str: String) {
        try {
            return [JSON.parse(str.replace(/=/g, ':')), true];
        } catch {
            return ['Could not parse state information', false];
        }
    }

    private get creationTS() {
        if (this.workflow.creationTS !== null) {
            let creation = moment(this.workflow.creationTS).format('HH:mm DD/MM/YYYY');
            return creation;
        } else {
            return '';        }
    }
    private get modTS() {
        if (this.workflow.lastModTS !== null) {
            return moment(this.workflow.lastModTS).format('HH:mm DD/MM/YYYY');
        } else {
            return '';        }
    }
    private get errorTS() {
        if (this.workflow.errorData !== null && this.workflow.errorData !== undefined) {
            return moment(this.workflow.errorData.errorTS).format('HH:mm DD/MM/YYYY');
        } else {
            return '';        }
    }
}
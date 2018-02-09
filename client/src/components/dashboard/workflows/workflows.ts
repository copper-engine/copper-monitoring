import { Component, Vue, Watch } from 'vue-property-decorator';
import { setTimeout } from 'timers';
import { WorkflowInfo, EngineStatus } from '../../../models/engine';
import { Notification } from '../../../models/notification';
import { JmxService } from '../../../services/jmxService';

import './workflows.scss';
import { ConnectionSettings } from '../../../models/connectionSettings';

export class WorkflowContext {
    public open: boolean = false;
    public reloading: boolean = false;
    public deleting: boolean = false;
}

const WorkflowHeading = () => import('./workflow-header').then(({ WorkflowHeading }) => WorkflowHeading);
const WorkflowFooter = () => import('./workflow-footer').then(({ WorkflowFooter }) => WorkflowFooter);

@Component({
    template: require('./workflows.html'),
    services: ['jmxService', 'eventHub'],
    components: {
        'workflowHeading': WorkflowHeading,
        'workflowFooter': WorkflowFooter
    }
})
export class WorkflowsComponent extends Vue {
    workflowsContext: Map<String, WorkflowContext> = new Map<String, WorkflowContext>(); 
    workflows: WorkflowInfo[] = [];
    fetchBrokenWFInterval: any;
    page: number = 1;
    perPage: number = 10;
    perPageItems: number[] = [10, 15, 25, 50];

    private jmxService: JmxService = this.$services.jmxService;
    private eventHub: Vue = this.$services.eventHub;

    get status() {
        return this.$store.state.engineStatus;
    }

    mounted() {
        this.sheduleFetchingBrrokenWF();
    }

    get totalPages() {
        if (this.$store.state.engineStatus) {
             let total = Math.ceil((this.$store.state.engineStatus as EngineStatus).brokenWFCount / this.perPage);

             if (this.page > total) {
                 this.page = 1; 
             }

             return total;
        }
        this.page = 1;
        return 1;
    }

    created() {
    }

    beforeDestroy() {
        clearInterval(this.fetchBrokenWFInterval);
    }

    @Watch('$store.state.connectionSettings')
    sheduleFetchingBrrokenWF() {
        if (this.fetchBrokenWFInterval) {
            clearInterval(this.fetchBrokenWFInterval);
        }
        this.getBrokenWorkflows(this.$store.state.connectionSettings);
        this.fetchBrokenWFInterval = setInterval(() => {
            this.getBrokenWorkflows(this.$store.state.connectionSettings);
        }, this.$store.state.connectionSettings.updatePeriod * 1000);
    }

    private getBrokenWorkflows(connectionSettings: ConnectionSettings) {
        this.jmxService.getBrokenWorkflows(connectionSettings, this.perPage, (this.page - 1) * this.perPage).then((response: WorkflowInfo[]) => {
            this.workflows = response;
        });
    }

    restartAll() {
        this.jmxService.restartAll(this.$store.state.connectionSettings)
            .then((done) => {
                this.forceStatusFetch(500);
                if (done) {
                    this.workflows.forEach((wf) => {
                        let currentID = wf.id;
                        this.highlight(currentID, 'reload');
                    });
                    this.showSuccess('All workflows restarted successfully');
                } else {
                    this.showError('Failed to restart all workflows');
                }
            }).catch((err) => {
                // TODO show toast
                this.showError('Failed to restart all workflows due to:' + err);
                console.error('Failed to restart workflows due to:', err);
            });
    }

    deleteAll() {
        this.jmxService.deleteAll(this.$store.state.connectionSettings, this.workflows)
        .then((done) => {
            if (done) {
                this.workflows.forEach((wf) => {
                    let currentID = wf.id;
                    this.highlight(currentID, 'delete');
                });
                this.showSuccess('All workflows deleted successfully');
            } else {
                this.showError('Failed to Delete all workflows');
            }
            this.forceStatusFetch(1500);
        }).catch((err) => {
            this.showError('Failed to Delete all workflows due to: ' + err);
            console.error('Failed to Delete all workflows due to:', err);
        });
    }

    restart(id: string) {
        this.jmxService.restart(this.$store.state.connectionSettings, id)
        .then((done) => {
            if (done) {
                this.highlight(id, 'reload');
                this.forceStatusFetch(500);
                this.showSuccess(`Workflow id: ${id} restarted successfully`);
            } else {
                this.showError(`Failed to restart workflow id: ${id}`);
            }
            
        }).catch((err) => {
            this.showError(`Failed to restart workflow id: ${id} due to: ${err}`);
            console.error(`Failed to restart workflow id: ${id} due to: ${err}`);
        });
    }

    deleteBroken(id: string) {
        this.jmxService.deleteBroken(this.$store.state.connectionSettings, id)
        .then((done) => {
            // this.forceStatusFetch();
            this.highlight(id, 'delete');
            setTimeout(() => { 
                this.workflows = this.workflows.filter((workflow) => workflow.id !== id);
                if (done) {
                    this.showSuccess(`Workflow id: ${id} deleted successfully`);
                } else {
                    this.showError(`Failed to delete workflow id: ${id}`);
                }
            }, 1500);
        }).catch((err) => {
            // TODO show toast
            this.showError(`Failed to delete workflow id: ${id} due to: ${err}`);
        });
    }

    highlight(id: String, type: String) {
        let wfContext = this.workflowsContext.get(id);
                if (!wfContext) {
                    wfContext = new WorkflowContext();
                }
                if (type === 'reload') {
                    wfContext.reloading = true;
                    this.workflowsContext.set(id, wfContext);
                    this.$forceUpdate();
                    setTimeout(() => { 
                        wfContext.reloading = false; 
                        this.workflowsContext.set(id, wfContext);
                        this.$forceUpdate();
                    }, 800);
                }
                if (type === 'delete') {
                    wfContext.deleting = true;
                    this.workflowsContext.set(id, wfContext);
                    this.$forceUpdate();
                }
    }

    showDetails(workflow: WorkflowInfo) {
        let wfContext = this.workflowsContext.get(workflow.id);
        if (!wfContext) {
            wfContext = new WorkflowContext();
        }
        wfContext.open = !wfContext.open; 
        this.workflowsContext.set(workflow.id, wfContext);
        this.$forceUpdate();
    }

    private showSuccess(message: String) {
        this.eventHub.$emit('showNotification', new Notification(message));
    }

    private showError(message: String) {
        this.eventHub.$emit('showNotification', new Notification(message, 'error'));
    }

    @Watch('page')
    @Watch('perPage')
    private forceStatusFetch(delay: number = 0) {
        setTimeout(() => {
            this.getBrokenWorkflows(this.$store.state.connectionSettings);
        }, delay);
    }
}
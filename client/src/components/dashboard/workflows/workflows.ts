import { Component, Vue, Watch } from 'vue-property-decorator';
import { setTimeout } from 'timers';
import { WorkflowInfo, EngineStatus } from '../../../models/engine';
import { Notification } from '../../../models/notification';
import { JmxService } from '../../../services/jmxService';

import './workflows.scss';
import { ConnectionSettings } from '../../../models/connectionSettings';
import { User } from '../../../models/user';

export class WorkflowContext {
    public open: boolean = false;
    public reloading: boolean = false;
    public deleting: boolean = false;
    public reloadButton: boolean = false;
    public deleteButton: boolean = false;
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
    restartingAll = false;
    deletingAll = false;
    dialog = false;
    dialogSourceCode = null;

    private jmxService: JmxService = this.$services.jmxService;
    private eventHub: Vue = this.$services.eventHub;

    get status() {
        return this.$store.state.engineStatus;
    }

    get disabled() {
        return this.restartingAll || this.deletingAll;
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
        this.getBrokenWorkflows(this.$store.state.connectionSettings, this.$store.state.user);
        this.fetchBrokenWFInterval = setInterval(() => {
            this.getBrokenWorkflows(this.$store.state.connectionSettings, this.$store.state.user);
        }, this.$store.state.connectionSettings.updatePeriod * 1000);
    }

    private getBrokenWorkflows(connectionSettings: ConnectionSettings, user: User) {
        this.jmxService.getBrokenWorkflows(connectionSettings, user, this.perPage, (this.page - 1) * this.perPage).then((response: WorkflowInfo[]) => {
            this.workflows = response;
        });
    }

    restartAll() {
        this.jmxService.restartAll(this.$store.state.connectionSettings, this.$store.state.user)
            .then((done) => {
                this.restartingAll = false;
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
                this.restartingAll = false;
            });
    }

    deleteAll() {
        this.deletingAll = true;
        this.jmxService.deleteAll(this.$store.state.connectionSettings, this.workflows, this.$store.state.user)
        .then((done) => {
            this.deletingAll = false;
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
            this.deletingAll = false;
        });
    }

    restart(id: string) {
        this.toggleButtons(id, 'restart');
        this.jmxService.restart(this.$store.state.connectionSettings, id, this.$store.state.user)
        .then((done) => {
            this.toggleButtons(id, 'restart');
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
            this.toggleButtons(id, 'restart');
        });
    }

    deleteBroken(id: string) {
        this.toggleButtons(id, 'delete');
        this.jmxService.deleteBroken(this.$store.state.connectionSettings, id, this.$store.state.user)
        .then((done) => {
            // this.forceStatusFetch();
            this.toggleButtons(id, 'delete');
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
            this.toggleButtons(id, 'delete');
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

    toggleButtons(id: String, type: String) {
        let wfContext = this.workflowsContext.get(id);
        if (!wfContext) {
            wfContext = new WorkflowContext();
        }
        if (type === 'restart') {
            wfContext.reloadButton = !wfContext.reloadButton;
        }
        if (type === 'delete') {
            wfContext.deleteButton = !wfContext.deleteButton;
        }
        this.workflowsContext.set(id, wfContext);
        this.$forceUpdate();
    }

    showSourceCode(workflow: WorkflowInfo) {
        this.jmxService.getSourceCode(this.$store.state.connectionSettings, this.$store.state.user, workflow.workflowClassInfo.classname)
        .then((response) => {
            this.dialogSourceCode = response;
            this.dialog = true;
        });
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
            this.getBrokenWorkflows(this.$store.state.connectionSettings, this.$store.state.user);
        }, delay);
    }
}
import { Component, Vue, Watch } from 'vue-property-decorator';
import { setTimeout } from 'timers';
import { WorkflowInfo, EngineStatus, WorkflowRepo, WorkflowFilter } from '../../../models/engine';
import { Notification } from '../../../models/notification';
import { JmxService } from '../../../services/jmxService';
import * as utils from '../../../util/utils';

import { ConnectionSettings } from '../../../models/connectionSettings';
import { User } from '../../../models/user';
import { MBeans } from '../../../models/mbeans';
import { HighlitedLine } from '../../../models/highlited-line';

import './workflows.scss';

export class WorkflowContext {
    public open: boolean = false;
    public reloading: boolean = false;
    public deleting: boolean = false;
    public reloadButton: boolean = false;
    public deleteButton: boolean = false;
}

const sourceCodeomponent = () => import('./../../core/source-code').then(({ SourceCodeComponent }) => SourceCodeComponent);
const WorkflowHeading = () => import('./workflow-header').then(({ WorkflowHeading }) => WorkflowHeading);
const WorkflowFooter = () => import('./workflow-footer').then(({ WorkflowFooter }) => WorkflowFooter);

@Component({
    template: require('./workflows.html'),
    services: ['jmxService', 'eventHub'],
    components: {
        'workflow-heading': WorkflowHeading,
        'workflow-footer': WorkflowFooter,
        'source-code': sourceCodeomponent,
    }
})
export class WorkflowsComponent extends Vue {

    private jmxService: JmxService = this.$services.jmxService;
    private eventHub: Vue = this.$services.eventHub;
    workflowsContext: Map<String, WorkflowContext> = new Map<String, WorkflowContext>(); 
    workflows: WorkflowInfo[] = [];
    wfCount: number = 0;
    fetchBrokenWFInterval: any;
    page: number = 1;
    perPage: number = 10;
    perPageItems: number[] = [10, 15, 25, 50];
    restartingAll = false;
    deletingAll = false;
    dialog = false;
    dialogSourceCode = null;
    dialogHighlitedlines: HighlitedLine[] = null;
    sourceCodeAvailable = true;
    filter: WorkflowFilter = new WorkflowFilter;

    mounted() {
        this.sheduleFetchingBrrokenWF();
    }
    beforeDestroy() {
        clearInterval(this.fetchBrokenWFInterval);
    }

    get status() {
        return this.$store.state.engineStatusList[this.$route.params.id];
    }

    get disabled() {
        return this.restartingAll || this.deletingAll;
    }

    get totalPages() {
        if (this.$store.state.engineStatusList[this.$route.params.id]) {

            let total = Math.ceil(Number(this.wfCount) / this.perPage);
            if (this.page > total) {
                this.page = 1; 
            }

            return total;
        }
        this.page = 1;
        return 1;
    }
    
    private showSuccess(message: String) {
        this.eventHub.$emit('showNotification', new Notification(message));
    }

    private getBrokenWorkflows(connectionSettings: ConnectionSettings, user: User, filter) {
        // TODO fix selecting correct bean
        this.jmxService.countWFRequest(this.$store.state.connectionSettings, this.$store.state.mbeans.engineMBeans[this.$route.params.id].name, this.$store.state.user, this.filter).then((response: number) => {
            this.wfCount = response;
        });
        this.jmxService.getBrokenWorkflows(connectionSettings, this.$store.state.mbeans.engineMBeans[this.$route.params.id].name, user, this.perPage, (this.page - 1) * this.perPage, filter).then((response: WorkflowInfo[]) => {
            this.workflows = response;
        });
    }

    private showError(message: String) {
        this.eventHub.$emit('showNotification', new Notification(message, 'error'));
    }

    applyFilter(newFilter: WorkflowFilter) {
        this.filter = newFilter;
        this.sheduleFetchingBrrokenWF();
    }

    restartAll() {
        this.jmxService.restartAll(this.$store.state.connectionSettings, this.$store.state.mbeans.engineMBeans[this.$route.params.id], this.$store.state.user)
            .then((done) => {
                this.restartingAll = false;
                this.forceStatusFetch(2000);
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

    restartFiltered(newFilter: WorkflowFilter) {
        this.jmxService.restartFiltered(this.$store.state.connectionSettings, this.$store.state.mbeans.engineMBeans[this.$route.params.id], this.$store.state.user, 0, 0, newFilter)
            .then((done) => {
                this.restartingAll = false;
                this.forceStatusFetch(2000);
                if (done) {
                    this.workflows.forEach((wf) => {
                        let currentID = wf.id;
                        this.highlight(currentID, 'reload');
                    });
                    this.showSuccess('Filtered workflows restarted successfully');
                } else {
                    this.showError('Failed to restart filtered workflows');
                }
            }).catch((err) => {
                this.showError('Failed to restart filtered workflows due to:' + err);
                console.error('Failed to restart filtered workflows due to:', err);
                this.restartingAll = false;
            });
    }

    deleteFiltered(newFilter: WorkflowFilter) {
        this.page = 1;
        this.jmxService.deleteFiltered(this.$store.state.connectionSettings, this.$store.state.mbeans.engineMBeans[this.$route.params.id], this.$store.state.user, 0, 0, newFilter)
            .then((done) => {
                this.deletingAll = false;
                this.forceStatusFetch(500);
                if (done) {
                    this.workflows.forEach((wf) => {
                        let currentID = wf.id;
                        this.highlight(currentID, 'delete');
                    });
                    this.showSuccess('Filtered workflows deleted successfully');
                } else {
                    this.showError('Failed to delete filtered workflows');
                }
                this.forceStatusFetch(1500);                
            }).catch((err) => {
                this.showError('Failed to delete filtered workflows due to:' + err);
                console.error('Failed to delete filtered workflows due to:', err);
                this.deletingAll = false;
            });
    }

    restart(id: string) {
        this.toggleButtons(id, 'restart');
        this.jmxService.restart(this.$store.state.connectionSettings, this.$store.state.mbeans.engineMBeans[this.$route.params.id], id, this.$store.state.user)
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
        this.jmxService.deleteBroken(this.$store.state.connectionSettings, this.$store.state.mbeans.engineMBeans[this.$route.params.id], id, this.$store.state.user)
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
                    setTimeout(() => { 
                        wfContext.deleting = false; 
                        this.workflowsContext.set(id, wfContext);
                        this.$forceUpdate();
                    }, 1500);
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
        .then((sourceCode) => {
            if (sourceCode && (sourceCode as string).trim().toLowerCase() !== 'na') {  
                this.dialogSourceCode = sourceCode;
                this.sourceCodeAvailable = true;
                this.dialogHighlitedlines = [];

                let waitPos = workflow.getLastWaitingLineNum();
                if (waitPos !== -1) {
                    this.dialogHighlitedlines.push(new HighlitedLine(waitPos, 'Last wait position'));
                }

                let errorPos = workflow.getErrorLineNum();
                if (errorPos) {
                    this.dialogHighlitedlines.push(new HighlitedLine(errorPos, 'Error position', 'error'));
                } 
            } else {
                this.dialogSourceCode = 'No Source Code Available';
                this.sourceCodeAvailable = false;
            }
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

    @Watch('$store.state.connectionSettings')
    sheduleFetchingBrrokenWF() {
        if (this.fetchBrokenWFInterval) {
            clearInterval(this.fetchBrokenWFInterval);
        }
        this.getBrokenWorkflows(this.$store.state.connectionSettings, this.$store.state.user, this.filter);
        this.fetchBrokenWFInterval = setInterval(() => {
            this.getBrokenWorkflows(this.$store.state.connectionSettings, this.$store.state.user, this.filter);
        }, this.$store.state.connectionSettings.updatePeriod * 1000);
    }

    @Watch('page')
    @Watch('perPage')
    private forceStatusFetch(delay: number = 0) {
        setTimeout(() => {
            this.getBrokenWorkflows(this.$store.state.connectionSettings, this.$store.state.user, this.filter);
        }, delay);
    }
}
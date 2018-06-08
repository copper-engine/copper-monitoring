import { Component, Vue, Watch } from 'vue-property-decorator';
import { setTimeout } from 'timers';
import { WorkflowInfo, EngineStatus, WorkflowRepo, WorkflowFilter, State } from '../../../models/engine';
import { Notification } from '../../../models/notification';
import { JmxService } from '../../../services/jmxService';
import * as utils from '../../../util/utils';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { ConnectionSettings } from '../../../models/connectionSettings';
import { User } from '../../../models/user';
import { MBeans, MBean } from '../../../models/mbeans';
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
const WorkflowDetails = () => import('./workflow-details').then(({ WorkflowDetails }) => WorkflowDetails);

@Component({
    template: require('./workflows.html'),
    services: ['jmxService', 'eventHub'],
    components: {
        'workflow-heading': WorkflowHeading,
        'workflow-footer': WorkflowFooter,
        'workflow-details': WorkflowDetails,
        'source-code': sourceCodeomponent,
        'scroll': VuePerfectScrollbar
    }
})
export class WorkflowsComponent extends Vue {
    private jmxService: JmxService = this.$services.jmxService;
    private eventHub: Vue = this.$services.eventHub;
    mbean: MBean = null;
    newComponent = false;
    workflowsContext: Map<String, WorkflowContext> = new Map<String, WorkflowContext>(); 
    workflows: WorkflowInfo[] = [];
    wfCount: number = 0;
    wfType: string = '';
    engineId: string = '';
    fetchWFInterval: any; // NodeJS.Timer
    page: number = 1;
    perPage: number = 10;
    perPageItems: number[] = [10, 15, 25, 50];
    restartingAll = false;
    deletingAll = false;
    dialogSourceOpen = false;
    dialogSourceCode = null;
    dialogHighlitedlines: HighlitedLine[] = null;
    dialogWF: WorkflowInfo = new WorkflowInfo;
    dialogWFOpen = false;
    dialogDeleteOpen = false;
    sourceCodeAvailable = true;
    filter: WorkflowFilter = new WorkflowFilter();
    clickAllowed: boolean[] = [];

    mounted() {
        this.init();
    }

    beforeDestroy() {
        clearInterval(this.fetchWFInterval);
    }

    init() {
        this.getWorkflowSettings();
        this.setFilterStates();
        this.sheduleFetchingWF();
    }

    @Watch('$store.state.connectionSettings')
    @Watch('$store.state.user.settings.updatePeriod')
    sheduleFetchingWF() {
        if (this.fetchWFInterval) {
            clearInterval(this.fetchWFInterval);
        }
        this.getWorkflows(this.$store.state.user, this.filter);
        this.fetchWFInterval = setInterval(() => {
            this.getWorkflows(this.$store.state.user, this.filter);
        }, this.$store.state.user.settings.updatePeriod * 1000);
    }

    @Watch('page')
    @Watch('perPage')
    private forceStatusFetch(delay: number = 0) {
        setTimeout(() => {
            this.getWorkflows(this.$store.state.user, this.filter);
        }, delay);
    }

    @Watch('$route')
    newPage() {
        this.newComponent = true;
        setTimeout(() => {
            this.newComponent = false;
        }, 200);
        this.mbean = this.$store.getters.engineMBeans[this.$route.params.id];
        this.workflows = [];
        this.wfCount = 0;
        this.init();
    }

    private getWorkflowSettings() {
        this.wfType = this.$route.params.wfType;
        this.engineId = this.$route.params.id;
        this.mbean = this.$store.getters.engineMBeans[this.engineId];
    }

    private setFilterStates() {
        this.filter = new WorkflowFilter();
        if (this.wfType === 'waiting') {
            this.filter.states = [State.WAITING];
        }
    }

    private get status() {
        return this.$store.state.engineStatusList[this.engineId];
    }

    private get disabled() {
        return this.restartingAll || this.deletingAll;
    }

    private get totalPages() {
        if (this.$store.state.engineStatusList[this.engineId]) {
            let total = Math.ceil(Number(this.wfCount) / this.perPage);
            if (this.page > total) {
                this.page = 1; 
            }
            if (total > 0) {
                return total;
            } else {
                return 1;
            }
        }
        this.page = 1;
        return 1;
    }

    private getWorkflows(user: User, filter) {
        this.jmxService.countWFRequest(this.mbean.connectionSettings, this.mbean.name, this.$store.state.user, this.filter).then((response: number) => {
            this.wfCount = response;
        });
        this.jmxService.getWorkflows(this.mbean.connectionSettings, this.mbean.name, user, this.perPage, (this.page - 1) * this.perPage, filter).then((response: WorkflowInfo[]) => {
            this.workflows = response;
            this.getClickAllowedList(this.workflows.length);
        });
    }

    private getClickAllowedList(amount: number) {
        for (let i = 0; i < amount; i++) {
            this.clickAllowed.push(true);
        }
    }

    private showError(message: String) {
        this.eventHub.$emit('showNotification', new Notification(message, 'error'));
    }

    private showSuccess(message: String) {
        this.eventHub.$emit('showNotification', new Notification(message));
    }

    private applyFilter(newFilter: WorkflowFilter) {
        this.filter = newFilter;
        this.sheduleFetchingWF();
    }

    private restartAll() {
        this.jmxService.restartAll(this.mbean.connectionSettings, this.mbean.name, this.$store.state.user)
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

    private restartFiltered(newFilter: WorkflowFilter) {
        this.jmxService.restartFiltered(this.mbean.connectionSettings, this.mbean.name, this.$store.state.user, 0, 0, newFilter)
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

    private deleteFiltered(newFilter: WorkflowFilter) {
        this.page = 1;
        if (newFilter === null) {
            newFilter = this.filter;
        }
        this.jmxService.deleteFiltered(this.mbean.connectionSettings, this.mbean.name, this.$store.state.user, 0, 0, newFilter)
            .then((done) => {
                this.deletingAll = false;
                this.forceStatusFetch(1500);
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

    private restart(id: string) {
        this.toggleButtons(id, 'restart');
        this.jmxService.restart(this.mbean.connectionSettings, this.mbean.name, id, this.$store.state.user)
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

    private deleteWorkflow(workflow: WorkflowInfo) {
        this.dialogDeleteOpen = false;
        let id = workflow.id;
        this.toggleButtons(id, 'delete');
        this.jmxService.deleteWorkflow(this.mbean.connectionSettings, this.mbean.name, id, this.wfType, this.$store.state.user)
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

    private highlight(id: String, type: String) {
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
            }, 900);
        }
        if (type === 'delete') {
            wfContext.deleting = true;
            this.workflowsContext.set(id, wfContext);
            this.$forceUpdate();
            setTimeout(() => { 
                wfContext.deleting = false; 
                this.workflowsContext.set(id, wfContext);
                this.$forceUpdate();
            }, 1800);
        }
    }

    private toggleButtons(id: String, type: String) {
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

    private showSourceCode(workflow: WorkflowInfo) {
        this.jmxService.getSourceCode(this.$store.getters.engineMBeans[this.status.id].connectionSettings,  this.$store.state.user, this.status.wfRepoMXBean, workflow.workflowClassInfo.classname)
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
                this.dialogSourceCode = null;
                this.sourceCodeAvailable = false;
            }
            this.dialogSourceOpen = true;
        });
    }

    private showDetails(workflow: WorkflowInfo, index: number) {
        if (this.clickAllowed[index] === true) {
            let wfContext = this.workflowsContext.get(workflow.id);
            if (!wfContext) {
                wfContext = new WorkflowContext();
            }
            wfContext.open = !wfContext.open;
            this.workflowsContext.set(workflow.id, wfContext);
            this.$forceUpdate();
            this.clickAllowed[index] = false;
            setTimeout(() => {
                this.clickAllowed[index] = true;
            }, 750);
        }
    }

    private areYouSure(workflow: WorkflowInfo) {
        this.dialogWF = workflow;
        this.dialogDeleteOpen = true;
    }

    private openWorkflowDialog(workflow: WorkflowInfo) {
        this.dialogWF = workflow;
        this.dialogWFOpen = true;
    }
}
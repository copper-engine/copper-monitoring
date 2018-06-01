import { Vue, Component, Watch} from 'vue-property-decorator';
import { JmxService } from '../../../services/jmxService';
import { ProcessorPool, EngineStatus } from '../../../models/engine';
import { Notification } from '../../../models/notification';
import Donut from './donut-graph';
import './processor-pools.scss';
import { StoreState } from '../../../store.vuex';
import { MBean } from '../../../models/mbeans';

@Component({
    template: require('./processor-pools.html'),
    components: {
        donut: Donut
    }
})

export class ProcessorPools extends Vue {
    private jmxService: JmxService = this.$services.jmxService;
    private eventHub: Vue = this.$services.eventHub;
    private engine: EngineStatus = null;
    newComponent = false;
    fetchPoolInterval: any;
    processorPools: ProcessorPool[] = [];
    engineMbean: MBean;
    dialogDeleteOpen: Boolean = false;
    selectedFunction: Function = null;
    selectedFunctionText: String = null;
    selectedBean: MBean = null;
    
    mounted() {
        this.init();
    }

    beforeDestroy() {
        clearInterval(this.fetchPoolInterval);
    }

    getProcessorPools() {
        this.jmxService.getProcessorPools(this.engineMbean.connectionSettings, this.engine.ppoolsMXBeans, this.engine.type, this.$store.state.user).then((response: any) => {
            this.processorPools = response;
        });
    }

    areYouSure(fx: Function, bean: MBean, text: String) {
        this.selectedFunction = fx;
        this.selectedBean = bean;
        this.selectedFunctionText = text;    
        this.dialogDeleteOpen = true;
    }   

    triggerSelectedFunction() {
        this.selectedFunction(this.selectedBean);
        this.dialogDeleteOpen = false;
    }

    resume(mbean: string) {
        this.jmxService.resume(this.engineMbean.connectionSettings, this.$store.state.user, mbean).then((done) => {
            if (done) {
                this.showSuccess('Workflows Resumed');
                setTimeout(this.getProcessorPools(), 1500);
            } else {
                this.showError('Unable to resume');
            }
        });
    }

    suspend(mbean: string) {
        this.jmxService.suspend(this.engineMbean.connectionSettings, this.$store.state.user, mbean).then((done) => {
            if (done) {
                this.showSuccess('Workflows Suspended');
                setTimeout(this.getProcessorPools(), 1500);                
            } else {
                this.showError('Unable to suspend');
            }
        });
    }

    resumeDeque(mbean: string) {
        this.jmxService.resumeDeque(this.engineMbean.connectionSettings, this.$store.state.user, mbean).then((done) => {
            if (done) {
                this.showSuccess('Deque Resumed');
                setTimeout(this.getProcessorPools(), 1500);
            } else {
                this.showError('Unable to resume deque');
            }
        });
    }

    suspendDeque(mbean: string) {
        this.jmxService.suspendDeque(this.engineMbean.connectionSettings, this.$store.state.user, mbean).then((done) => {
            if (done) {
                this.showSuccess('Deque Suspended');
                setTimeout(this.getProcessorPools(), 1500);               
            } else {
                this.showError('Unable to suspend deque');
            }
        });
    }

    @Watch('$route.params')
    init() {
        this.newComponent = true;
        setTimeout(() => {
            this.newComponent = false;
        }, 200);
        this.processorPools = [];
        this.engine = (this.$store.state as  StoreState).engineStatusList[this.$route.params.id];
        this.engineMbean = this.$store.getters.engineMBeans[this.$route.params.id];
        this.scheduleFetchPools();
    }

    @Watch('$store.state.connectionSettings')
    scheduleFetchPools() {
        if (this.fetchPoolInterval) {
            clearInterval(this.fetchPoolInterval);
        }
        this.getProcessorPools();
        // TODO get time from usersettings
        this.fetchPoolInterval = setInterval(() => {
            this.getProcessorPools();
        }, 10 * 1000);
    }
    
    private showSuccess(message: string) {
        this.eventHub.$emit('showNotification', new Notification(message));
    }

    private showError(message: string) {
        this.eventHub.$emit('showNotification', new Notification(message, 'error'));
    }
}
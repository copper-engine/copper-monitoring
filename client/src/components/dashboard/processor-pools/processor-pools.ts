import { Vue, Component, Watch} from 'vue-property-decorator';
import { JmxService } from '../../../services/jmxService';
import { ProcessorPool, EngineStatus } from '../../../models/engine';
import { Notification } from '../../../models/notification';
import Donut from './donut-graph';
import './processor-pools.scss';
import { StoreState } from '../../../store.vuex';

@Component({
    template: require('./processor-pools.html'),
    components: {
        donut: Donut
    }
})

export class ProcessorPools extends Vue {
    private jmxService: JmxService = this.$services.jmxService;
    private eventHub: Vue = this.$services.eventHub;
    fetchPoolInterval: any;
    processorPools: ProcessorPool[] = [];
    private engine: EngineStatus = null;
    
    mounted() {
        this.init();
    }

    beforeDestroy() {
        clearInterval(this.fetchPoolInterval);
    }

    getProcessorPools() {
        this.jmxService.getProcessorPools(this.$store.state.connectionSettings, this.engine.ppoolsMXBeans, this.$store.state.user).then((response: any) => {
            this.processorPools = response;
        });
    }

    resume(mbean: string) {
        this.jmxService.resume(this.$store.state.connectionSettings, this.$store.state.user, mbean).then((done) => {
            if (done) {
                this.showSuccess('Workflows Resumed');
                setTimeout(this.getProcessorPools(), 1500);
            } else {
                this.showError('Unable to resume');
            }
        });
    }

    suspend(mbean: string) {
        this.jmxService.suspend(this.$store.state.connectionSettings, this.$store.state.user, mbean).then((done) => {
            if (done) {
                this.showSuccess('Workflows Suspended');
                setTimeout(this.getProcessorPools(), 1500);                
            } else {
                this.showError('Unable to suspend');
            }
        });
    }

    resumeDeque(mbean: string) {
        this.jmxService.resumeDeque(this.$store.state.connectionSettings, this.$store.state.user, mbean).then((done) => {
            if (done) {
                this.showSuccess('Deque Resumed');
                setTimeout(this.getProcessorPools(), 1500);
            } else {
                this.showError('Unable to resume deque');
            }
        });
    }

    suspendDeque(mbean: string) {
        this.jmxService.suspendDeque(this.$store.state.connectionSettings, this.$store.state.user, mbean).then((done) => {
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
        this.engine = (this.$store.state as  StoreState).engineStatusList[this.$route.params.id];
        this.scheduleFetchPools();
    }

    @Watch('$store.state.connectionSettings')
    scheduleFetchPools() {
        if (this.fetchPoolInterval) {
            clearInterval(this.fetchPoolInterval);
        }
        this.getProcessorPools();
        this.fetchPoolInterval = setInterval(() => {
            this.getProcessorPools();
        }, this.$store.state.connectionSettings.updatePeriod * 1000);
    }
    
    private showSuccess(message: string) {
        this.eventHub.$emit('showNotification', new Notification(message));
    }

    private showError(message: string) {
        this.eventHub.$emit('showNotification', new Notification(message, 'error'));
    }

}
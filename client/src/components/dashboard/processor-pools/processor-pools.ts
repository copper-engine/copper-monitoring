import { Vue, Component} from 'vue-property-decorator';
import { JmxService } from '../../../services/jmxService';
import { ProcessorPool } from '../../../models/engine';
import { Notification } from '../../../models/notification';
import Donut from './donut-graph';
import Bar from './bar-graph';
import './processor-pools.scss';

@Component({
    template: require('./processor-pools.html'),
    components: {
        donut: Donut,
        bar: Bar
    }
})

export class ProcessorPools extends Vue {
    private jmxService: JmxService = this.$services.jmxService;
    private eventHub: Vue = this.$services.eventHub;
    processorPools: ProcessorPool[] = [];
    

    created() {
        this.getProcessorPools();
    }

    getProcessorPools() {
        this.jmxService.getProcessorPools(this.$store.state.connectionSettings, this.$store.state.user).then((response: ProcessorPool) => {
            response.numActiveThreads = 3;
            response.queueSize = 8;
            this.processorPools = [];
            this.processorPools.push(response);
            this.processorPools.push(response);
            this.processorPools.push(response);
        });
    }

    resume() {
        this.jmxService.resume(this.$store.state.connectionSettings, this.$store.state.user).then((done) => {
            if (done) {
                this.showSuccess('Workflows Resumed');
                this.getProcessorPools();
            } else {
                this.showError('Unable to resume');
            }
        });
    }

    suspend() {
        this.jmxService.suspend(this.$store.state.connectionSettings, this.$store.state.user).then((done) => {
            if (done) {
                this.showSuccess('Workflows Suspended');
                this.getProcessorPools();                
            } else {
                this.showError('Unable to suspend');
            }
        });
    }

    resumeDeque() {
        this.jmxService.resumeDeque(this.$store.state.connectionSettings, this.$store.state.user).then((done) => {
            if (done) {
                this.showSuccess('Deque Resumed');
                this.getProcessorPools();
            } else {
                this.showError('Unable to resume deque');
            }
        });
    }

    suspendDeque() {
        this.jmxService.suspendDeque(this.$store.state.connectionSettings, this.$store.state.user).then((done) => {
            if (done) {
                this.showSuccess('Deque Suspended');
                this.getProcessorPools();                
            } else {
                this.showError('Unable to suspend deque');
            }
        });
    }
    
    private showSuccess(message: string) {
        this.eventHub.$emit('showNotification', new Notification(message));
    }

    private showError(message: string) {
        this.eventHub.$emit('showNotification', new Notification(message, 'error'));
    }

}
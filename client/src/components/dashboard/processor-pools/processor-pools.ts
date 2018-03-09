import { Vue, Component} from 'vue-property-decorator';
import { JmxService } from '../../../services/jmxService';
import { ProcessorPool } from '../../../models/engine';
import Donut from './donut-graph';
import './processor-pools.scss';

@Component({
    template: require('./processor-pools.html'),
    components: {
        donut: Donut
    }
})

export class ProcessorPools extends Vue {
    private jmxService: JmxService = this.$services.jmxService;
    processorPools: ProcessorPool[] = [];

    getProcessorPools() {
        this.jmxService.getProcessorPools(this.$store.state.connectionSettings, this.$store.state.user).then((response: ProcessorPool) => {
            response.numActiveThreads = 3;
            this.processorPools.push(response);
        });
    }

    created() {
        this.getProcessorPools();
    }

}
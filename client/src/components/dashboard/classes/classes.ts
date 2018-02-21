import { Vue, Component} from 'vue-property-decorator';
import { EngineStatus } from '../../../models/engine';
import './classes.scss';

@Component({
    template: require('./classes.html')
})

export class Classes extends Vue {
    wfName: String;

    created() {
        this.wfName = this.$store.state.engineStatus.wfRepoMXBeanName;
    }

}
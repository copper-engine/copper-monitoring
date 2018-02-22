import { Vue, Component} from 'vue-property-decorator';
import { EngineStatus } from '../../../models/engine';
import { JmxService } from '../../../services/jmxService';
import './classes.scss';

@Component({
    template: require('./classes.html')
})

export class Classes extends Vue {

    private jmxService: JmxService = this.$services.jmxService;

    wfName: String;
    // receivedArray: any = [];
    wfArray: any = [];

    page: number = 1;
    perPage: number = 10;
    perPageItems: number[] = [10, 15, 25, 50];

    created() {
        this.wfName = this.$store.state.engineStatus.wfRepoMXBeanName;
        console.log('... requesting wfrepo info...');
        this.jmxService.getWfRepo(this.$store.state.connectionSettings, this.$store.state.user, this.$store.state.engineStatus.wfRepoMXBeanName).then((response: Object) => {
            // this.receivedArray = response;
            // console.log(this.receivedArray[0]);
            this.wfArray = (response as any[]).map(this.addOpenAttribute);
            console.log(this.wfArray);
        });
    }

    // sendRequest() {
    //     console.log('... requesting wfrepo info...');
    //     this.jmxService.getWfRepo(this.$store.state.connectionSettings, this.$store.state.user, this.$store.state.engineStatus.wfRepoMXBeanName).then((response: Object) => {
    //         this.receivedArray = response;
    //         // console.log(this.receivedArray[0]);
    //         this.wfArray = this.receivedArray.map(this.addOpenAttribute);
    //         console.log(this.wfArray);
    //     });

    // }

    addOpenAttribute(element) {
        element.open = false;
        return element;
    }

    toggleOpen(index) {
        // console.log('... opening...');
        this.wfArray[index].open = !this.wfArray[index].open;
        this.$forceUpdate();
    }

    get totalPages() {
        if (this.wfArray.length > 0) {
             let total = Math.ceil(this.wfArray.length / this.perPage);

             if (this.page > total) {
                 this.page = 1; 
             }

             return total;
        }
        this.page = 1;
        return 1;
    }

}
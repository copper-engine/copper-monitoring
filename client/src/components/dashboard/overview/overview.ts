import { Component, Vue, Watch } from 'vue-property-decorator';
import { EngineGroup } from '../../../models/engine';
import './overview.scss';

@Component({
    template: require('./overview.html'),
    services: ['jmxService', 'eventHub']
})
export class Overview extends Vue {
    groups: EngineGroup[] = [];
    timeSelect: string[] = ['5 sec', '15 sec', '30 sec', '1 min', '5 min', '15 min'];
    layoutSelect: string[]= ['Row', 'Column'];
    newTime: string = '';
    newLayout: string = ''; 
    openOptions: boolean = false;

    mounted() {
        this.groups = this.$store.getters.groupsOfEngines;
    }

    get getRow() {
        if (this.newLayout === 'Row' || this.newLayout === '') {
            return true;
        }
        else {
            return false;
        }
    }
}
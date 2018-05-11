import { Component, Vue, Watch } from 'vue-property-decorator';
import { EngineGroup } from '../../../models/engine';
import './overview.scss';

@Component({
    template: require('./overview.html'),
    services: ['jmxService', 'eventHub']
})
export class Overview extends Vue {
    groups: EngineGroup[] = [];
    updatePeriod: number = 10;
    fetchPeriod: number = 10;
    numSelect: number[] = [5, 10, 15];
    openOptions: boolean = false;

    mounted() {
        this.groups = this.$store.getters.groupsOfEngines;
    }

    triggerOpenOptions() {
        this.openOptions = !this.openOptions;
    }

}
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { EngineGroup, EngineStatus } from '../../../../models/engine';

const statusComponent = () => import('./status').then(({ StatusComponent }) => StatusComponent);

@Component({
    template: require('./engine-group.html'),
    components: {
        'status': statusComponent
    }
})
export class EngineGroupComponent extends Vue {
    @Prop() group: EngineGroup;
    @Prop() closing: boolean;
    open: boolean = false;
    closeAll: boolean = false;

    parseGroupName(rawName: string) {
        return rawName.substr(15);
    }

    @Watch('closing')
    close() {
        if (this.closing === true) {
            this.open = false;
        }
    }

}
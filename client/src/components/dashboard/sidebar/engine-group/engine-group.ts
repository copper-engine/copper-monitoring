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
    open: boolean = true;
    closeAll: boolean = false;
    multiEngine: boolean = false;

    parseGroupName(rawName: string) {
        return rawName.substr(15);
    }

    created() {
        this.checkMultiEngine();
    }

    @Watch('group')
    checkMultiEngine() {
        if (this.group.engines.length > 1) {
            this.multiEngine = true;
            this.open = false;
        }
    }

    @Watch('closing')
    close() {
        if (this.closing === true) {
            this.open = false;
        }
    }

}
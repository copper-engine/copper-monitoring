import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { EngineGroup, EngineStatus } from '../../../../models/engine';
import { Link } from '../../../../models/link';

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
    multiEngine: boolean = false;

    parseGroupName(rawName: string) {
        return rawName.substr(15);
    }

    created() {
        this.checkMultiEngine();
    }

    get links(): Link[] {
        
        return [
            new Link('Statistics', '/dashboard/statistics/' + ('group:' + this.parseGroupName(this.group.name)) + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-chart-bar'),
            new Link('Broken Workflows', '/dashboard/workflows/' + this.group.engines[0].id + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-image-broken'),
        ];
    }

    @Watch('group')
    checkMultiEngine() {
        if (this.group.engines.length > 1) {
            this.multiEngine = true;
        }
    }

    @Watch('closing')
    close() {
        if (this.closing === true) {
            this.open = false;
        }
    }

}
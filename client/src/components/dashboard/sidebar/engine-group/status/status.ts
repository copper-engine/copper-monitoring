import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { JmxService } from '../../../../../services/jmxService';
import { ConnectionSettings } from '../../../../../models/connectionSettings';
import './status.scss';
import { Link } from '../../../../../models/link';
import { EngineStatus } from '../../../../../models/engine';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

@Component({
    template: require('./status.html'),
})
export class StatusComponent extends Vue {
    @Prop() status: EngineStatus;
    @Prop() connectionSettings: ConnectionSettings;
    @Prop() multiEngine: boolean;
    @Prop() closing: boolean;
    @Prop() mbean: string;
    open: boolean = false;

    get extendType() {
        if (this.multiEngine === true) {
            return 'extend-links-limited';
        } else {
            return 'extend-links';
        }
    }

    get extendStatusType() {
        if (this.multiEngine === true) {
            return 'extend-status-limited';
        } else {
            return 'extend-status';
        }
    }

    get links(): Link[] {
        let linkArray = [];
        if (!this.multiEngine) {
            linkArray.push(new Link('Statistics', '/dashboard/statistics/' + this.status.id + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-chart-bar'));
            linkArray.push(new Link('Broken Workflows', '/dashboard/workflows/' + ('broken:' + this.status.id) + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-image-broken'));
            linkArray.push(new Link('Waiting Workflows', '/dashboard/workflows/' + ('waiting:' + this.status.id) + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-timer-sand-empty'));
        }
        linkArray.push(new Link('Workflow Repository', '/dashboard/workflow-repo/' + this.status.id + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-file'));
        linkArray.push(new Link('Processor Pools', '/dashboard/processor-pools/' + this.status.id + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-server'));
        
        return linkArray;
    }

    @Watch('closing')
    close() {
        if (this.closing === true) {
            this.open = false;
        }
    }

}
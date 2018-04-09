import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { JmxService } from '../../../../../services/jmxService';
import { ConnectionSettings } from '../../../../../models/connectionSettings';
import './engine.scss';
import { Link } from '../../../../../models/link';
import { EngineStatus } from '../../../../../models/engine';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

@Component({
    template: require('./engine.html'),
})
export class EngineComponent extends Vue {
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
        let params = this.status.id + '?' + this.$store.getters.connectionsAsParams;
        if (!this.multiEngine) {
            linkArray = linkArray.concat([
                new Link('Statistics', '/dashboard/statistics/' + params, 'mdi-chart-bar'),
                new Link('Broken Workflows', '/dashboard/workflows/' + params, 'mdi-image-broken'),
                new Link('Waiting Workflows', '/dashboard/waiting-workflows/' + params, 'mdi-timer-sand-empty')
            ]);
        }
        
        return linkArray.concat([
            new Link('Workflow Repository', '/dashboard/workflow-repo/' + params, 'mdi-file'),
            new Link('Processor Pools', '/dashboard/processor-pools/' + params, 'mdi-server')
        ]);
    }

    @Watch('closing')
    close() {
        if (this.closing === true) {
            this.open = false;
        }
    }

}
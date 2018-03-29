import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { JmxService } from '../../../../../services/jmxService';
import { ConnectionSettings } from '../../../../../models/connectionSettings';
import './status.scss';
import { Link } from '../../../../../models/link';
import { EngineStatus } from '../../../../../models/engine';

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
        let params = this.status.id + '?connection=' + this.$store.state.connectionSettings.host + '|' + this.$store.state.connectionSettings.port;
        if (!this.multiEngine) {
            linkArray = linkArray.concat([
                new Link('Statistics', '/dashboard/statistics/' + params, 'mdi-chart-bar'),
                new Link('Broken Workflows', '/dashboard/workflows/' + params, 'mdi-image-broken'),
                new Link('Waiting Workflows', '/dashboard/waiting-workflows/' + this.status.id + params, 'mdi-timer-sand-empty')
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
import { Component, Vue, Prop } from 'vue-property-decorator';

import { JmxService } from '../../../../services/jmxService';
import { ConnectionSettings } from '../../../../models/connectionSettings';

import './status.scss';
import { Link } from '../../../../models/link';
import { EngineStatus } from '../../../../models/engine';

@Component({
    template: require('./status.html'),
})
export class StatusComponent extends Vue {
    @Prop() status: EngineStatus;
    @Prop() connectionSettings: ConnectionSettings;
    @Prop() mbean: string;
    open: boolean = false;

    get links(): Link[] {
        
        return [
            new Link('Statistics', '/dashboard/statistics/' + this.status.id + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-home'),
            new Link('Broken Workflows', '/dashboard/workflows/' + this.status.id + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-image-broken'),
            new Link('Workflow Repository', '/dashboard/workflow-repo/' + this.status.id + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-file'),
            new Link('Processor Pools', '/dashboard/processor-pools/' + this.status.id + '?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-server')
        ];
    }
}
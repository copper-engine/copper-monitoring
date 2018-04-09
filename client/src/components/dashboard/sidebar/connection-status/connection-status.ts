import { Component, Vue, Prop } from 'vue-property-decorator';

import './connection-status.scss';
import { ConnectionSettings, ConnectionResult } from '../../../../models/connectionSettings';

const configComponent = () => import('../config').then(({ ConfigComponent }) => ConfigComponent);

@Component({
    template: require('./connection-status.html'),
    components: {
        'config': configComponent
    }
})
export class ConnectionStatusComponent extends Vue {
    @Prop() connection: ConnectionResult;

    showSettings = false;

    updateTarget(connectionSettings: ConnectionSettings) {
        this.showSettings = false;
        this.$emit('updateTarget', connectionSettings);
    }

    deleteSettings() {
        this.$emit('deleteSettings');
    }
}
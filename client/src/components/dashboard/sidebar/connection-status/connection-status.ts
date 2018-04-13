import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

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
    @Prop() index: number;
    @Prop() closingConnections: number[];
    showSettings = false;

    @Watch('closingConnections')
    checkClosing() {
        for (let i = 0; i < this.closingConnections.length; i++) {
            if (this.closingConnections[i] === this.index) {
                this.showSettings = false;
            }
        }
    }

    openSettings() {
        this.showSettings = !this.showSettings;
        if (this.showSettings === true) {
            this.$emit('closeOthers');
        }
    }

    updateTarget(connectionSettings: ConnectionSettings) {
        this.showSettings = false;
        this.$emit('updateTarget', connectionSettings);
    }

    deleteSettings() {
        this.$emit('deleteSettings');
    }
}
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Notification } from '../../../../models/notification';
import { ConnectionSettings } from '../../../../models/connectionSettings';
import './config.scss';
import { setTimeout } from 'timers';

@Component({
    template: require('./config.html')
    // dependencies : ['myService']
})
export class ConfigComponent extends Vue {
    @Prop() connectionSettings: ConnectionSettings;
    @Prop() type: string;

    host: string = '';
    port: string = '1099';
    valid = true;
    dialogDeleteOpen: boolean = false;

    // Form Validation Rules
    hostRules = [ (v) => !!v || 'Host is required' ];
    portRules = [ (v) => !!v || 'Port is required' ];
    numberRules = [ (v) => /^\d+$/.test(v) || 'Should be number' ];
    
    mounted() {
        this.host = this.connectionSettings.host;
        this.port = this.connectionSettings.port;
    }

    private deleteSettings() {
        this.dialogDeleteOpen = false;
        this.$emit('deleteSettings');
    }

    private submit() {
        let newConncection = new ConnectionSettings(this.host, this.port);
        if (this.checkDuplicateConnection(newConncection) === false) {
            this.$emit('updateTarget', new ConnectionSettings(this.host, this.port));
        } else {
            this.$services.eventHub.$emit('showNotification', new Notification('Connection is a duplicate', 'error'));
        }
    }

    private checkDuplicateConnection(newConnection: ConnectionSettings) {
        if ((this.type !== 'createNew') && (newConnection.host === this.connectionSettings.host) && (newConnection.port === this.connectionSettings.port)) {
            return false;
        }
        let currentConnections = this.$store.state.connectionSettings;
        let duplicate = false;
        for (let i = 0; i < currentConnections.length; i++) {
            if ((newConnection.host === currentConnections[i].host) && (newConnection.port === currentConnections[i].port)) {
                duplicate = true;
            }
        }
        return duplicate;
    }

}
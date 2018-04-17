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
    fetchPeriod: number = 5;
    updatePeriod: number = 10;
    valid = true;
    deleting = false;

    // Form Validation Rules
    hostRules = [ (v) => !!v || 'Host is required' ];
    portRules = [ (v) => !!v || 'Port is required' ];
    numberRules = [ (v) => /^\d+$/.test(v) || 'Should be number' ];
    
    mounted() {
        this.host = this.connectionSettings.host;
        this.port = this.connectionSettings.port;
        this.fetchPeriod = this.connectionSettings.fetchPeriod;
        this.updatePeriod = this.connectionSettings.updatePeriod;
    }

    deleteSettings() {
        this.deleting = true;
        this.$emit('deleteSettings');
    }

    submit() {
        let newConncection = new ConnectionSettings(this.host, this.port, this.fetchPeriod, this.updatePeriod);
        if (this.checkDuplicateConnection(newConncection) === false) {
            this.$emit('updateTarget', new ConnectionSettings(this.host, this.port, this.fetchPeriod, this.updatePeriod));
        } else {
            this.$services.eventHub.$emit('showNotification', new Notification('Connection is a duplicate', 'error'));
        }
    }

    checkDuplicateConnection(newConnection: ConnectionSettings) {
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
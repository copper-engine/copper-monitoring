import { Component, Vue, Prop } from 'vue-property-decorator';

import './config.scss';
import { ConnectionSettings } from '../../../../models/connectionSettings';

@Component({
    template: require('./config.html')
    // dependencies : ['myService']
})
export class ConfigComponent extends Vue {
    // @Prop() connectionSettings: ConnectionSettings;

    host: string = '';
    port: string = '1099';
    fetchPeriod: number = 5;
    updatePeriod: number = 10;
    valid = true;

    // Form Validation Rules
    hostRules = [ (v) => !!v || 'Host is required' ];
    portRules = [ (v) => !!v || 'Port is required' ];
    numberRules = [ (v) => /^\d+$/.test(v) || 'Should be number' ];
    
    get connectionSettings() {
        return this.$store.state.connectionSettings;
    }

    mounted() {
        this.host = this.connectionSettings.host;
        this.port = this.connectionSettings.port;
        this.fetchPeriod = this.connectionSettings.fetchPeriod;
        this.updatePeriod = this.connectionSettings.updatePeriod;
    }

    submit () {
        this.$emit('updateTarget', new ConnectionSettings(this.host, this.port, this.fetchPeriod, this.updatePeriod));
    }

}
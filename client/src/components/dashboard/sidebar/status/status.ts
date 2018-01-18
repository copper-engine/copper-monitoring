import { Component, Vue, Prop } from 'vue-property-decorator';

import { JmxService } from '../../../../services/jmxService';
import { ConnectionSettings } from '../../../../models/connectionSettings';

import './status.scss';

@Component({
    template: require('./status.html'),
})
export class StatusComponent extends Vue {
    

    get status() {
        return this.$store.state.engineStatus;
    }
    get connectionSettings() {
        return this.$store.state.connectionSettings;
    }
}
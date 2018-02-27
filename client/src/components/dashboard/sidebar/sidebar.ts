import { Component, Vue, Prop } from 'vue-property-decorator';
import { Link } from '../../../models/link';
import { ConnectionSettings } from '../../../models/connectionSettings';
import './sidebar.scss';

const statusComponent = () => import('./status').then(({ StatusComponent }) => StatusComponent);
const configComponent = () => import('./config').then(({ ConfigComponent }) => ConfigComponent);

@Component({
    template: require('./sidebar.html'),
    components: {
        'status': statusComponent,
        'config': configComponent,
    }
})
export class SidebarComponent extends Vue {
    drawer = null;
    miniVariant = false;
    settingsShowed = false;
    
    get links(): Link[] {

     return [
        new Link('Home', '/dashboard/homepage?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-home'),
        new Link('Broken Workflows', '/dashboard/workflows?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-image-broken'),
        new Link('Workflow Repository', '/dashboard/classes?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port, 'mdi-file')
      ];
    }
      
    updateTarget(connectionSettings) {
        this.settingsShowed = false;
        this.$store.commit('updateConnectionSettings', connectionSettings);
        this.$router.push('/dashboard?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port);
    }
}
import { Component, Vue, Prop } from 'vue-property-decorator';
import { ConnectionSettings } from '../../../models/connectionSettings';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import './sidebar.scss';

const statusComponent = () => import('./status').then(({ StatusComponent }) => StatusComponent);
const configComponent = () => import('./config').then(({ ConfigComponent }) => ConfigComponent);

@Component({
    template: require('./sidebar.html'),
    components: {
        'status': statusComponent,
        'config': configComponent,
        'scroll': VuePerfectScrollbar
    }
})
export class SidebarComponent extends Vue {
    drawer = null;
    miniVariant = false;
    settingsShowed = false;
    host = this.$store.state.connectionSettings.host;
    port = this.$store.state.connectionSettings.port;
      
    updateTarget(connectionSettings) {
        this.settingsShowed = false;
        this.$store.commit('updateConnectionSettings', connectionSettings);
        this.host = this.$store.state.connectionSettings.host;
        this.port = this.$store.state.connectionSettings.port;
        this.$router.push('/dashboard?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port);
    }
}
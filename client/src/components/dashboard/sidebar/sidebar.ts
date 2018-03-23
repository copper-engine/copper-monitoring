import { Component, Vue, Prop } from 'vue-property-decorator';
import { ConnectionSettings } from '../../../models/connectionSettings';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import './sidebar.scss';
import { setTimeout } from 'timers';

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
    closeAll = false;

    get connected() {
        return (this.$store.state.engineStatusList && this.$store.state.engineStatusList.length > 0);
    }

    showSettings() {
        this.settingsShowed = !this.settingsShowed;
        if (this.settingsShowed === true) {
            this.closeAll = true;
            setTimeout(() => { 
                this.closeAll = false;
            }, 1000);
        }

    }
      
    updateTarget(connectionSettings) {
        this.settingsShowed = false;
        this.$store.commit('updateConnectionSettings', connectionSettings);
        this.host = this.$store.state.connectionSettings.host;
        this.port = this.$store.state.connectionSettings.port;
        this.$router.push('/dashboard?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port);
    }
}
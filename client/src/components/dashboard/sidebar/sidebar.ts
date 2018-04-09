import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { ConnectionSettings } from '../../../models/connectionSettings';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { setTimeout } from 'timers';
import './sidebar.scss';

const connectionStatusComponent = () => import('./connection-status').then(({ ConnectionStatusComponent }) => ConnectionStatusComponent);
const engineGroupComponent = () => import('./engine-group').then(({EngineGroupComponent}) => EngineGroupComponent);
const configComponent = () => import('./config').then(({ ConfigComponent }) => ConfigComponent);

@Component({
    template: require('./sidebar.html'),
    components: {
        'connection-status': connectionStatusComponent,
        'group': engineGroupComponent,
        'scroll': VuePerfectScrollbar,
        'config': configComponent
    }
})
export class SidebarComponent extends Vue {
    drawer = null;
    miniVariant = false;
    settingsShowed = false;
    connected = false;
    closeAll = false;

    emptyConnectionSettings = new ConnectionSettings();

    showSettings() {
        this.settingsShowed = !this.settingsShowed;
        if (this.settingsShowed === true) {
            this.closeAll = true;
            setTimeout(() => { 
                this.closeAll = false;
            }, 1000);
        }
    }
      
    updateTarget(index: number, connectionSettings: ConnectionSettings) {
        this.settingsShowed = false;
        this.$store.commit('updateConnectionSettings', {index: index, connectionSettings: connectionSettings});
        this.$router.push('/dashboard?' + this.$store.getters.connectionsAsParams);
    }

    deleteSettings(index: number) {
        this.$store.commit('deleteConnectionSettings', index);
        this.$router.push('/dashboard?' + this.$store.getters.connectionsAsParams);
    }
}
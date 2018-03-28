import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { ConnectionSettings } from '../../../models/connectionSettings';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { setTimeout } from 'timers';
import './sidebar.scss';

const configComponent = () => import('./config').then(({ ConfigComponent }) => ConfigComponent);
const engineGroupComponent = () => import('./engine-group').then(({EngineGroupComponent}) => EngineGroupComponent);

@Component({
    template: require('./sidebar.html'),
    components: {
        'config': configComponent,
        'group': engineGroupComponent,
        'scroll': VuePerfectScrollbar
    }
})
export class SidebarComponent extends Vue {
    drawer = null;
    miniVariant = false;
    settingsShowed = false;
    connected = false;
    host = this.$store.state.connectionSettings.host;
    port = this.$store.state.connectionSettings.port;
    closeAll = false;

    // get connected() {
    //     return (this.$store.state.engineStatusList && this.$store.state.engineStatusList.length > 0);
    // }

    mounted() {
        this.updatedConnectedStatus();
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

    updatedConnectedStatus() {
        setTimeout(() => { 
            console.log('new status');
            console.log(this.$store.state.engineStatusList);
            this.connected = (this.$store.state.engineStatusList && this.$store.state.engineStatusList.length > 0);
        }, 1000);
    }
      
    updateTarget(connectionSettings) {
        this.settingsShowed = false;
        this.$store.commit('updateConnectionSettings', connectionSettings);
        this.host = this.$store.state.connectionSettings.host;
        this.port = this.$store.state.connectionSettings.port;
        this.$router.push('/dashboard?host=' + this.$store.state.connectionSettings.host + '&port=' + this.$store.state.connectionSettings.port);
        this.updatedConnectedStatus();
    }

    @Watch('this.$store.state.engineStatusList') 
    updateConnected() {
        this.updatedConnectedStatus();
    }
}
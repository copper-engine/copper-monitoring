import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { ConnectionSettings } from '../../../models/connectionSettings';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { setTimeout } from 'timers';
import './sidebar.scss';
import { Mutations } from '../../../store.vuex';

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
    closeAllEngines = false;
    selectConnectionsToClose = [];
    clickAllowed = true;

    emptyConnectionSettings = new ConnectionSettings();

    get getOverviewPath() {
        let params = '?' + this.$store.getters.connectionsAsParams;
        return ('/dashboard/overview/' + params);
    }

    showSettings() {
        if (this.clickAllowed === true) {
            this.settingsShowed = !this.settingsShowed;
            if (this.settingsShowed === true) {
                this.triggerCloseAllEngines();
                this.closeSelectConnections(-1);
            }
            this.clickAllowed = false;
            setTimeout(() => { 
                this.clickAllowed = true;
            }, 1000);
        }
    }

    triggerCloseAllEngines() {
        this.closeAllEngines = true;
        setTimeout(() => { 
            this.closeAllEngines = false;
        }, 1000);
    }

    closeSelectConnections(opened: number) {
        if (opened !== -1) {
            this.settingsShowed = false;
        } 
        this.selectConnectionsToClose = this.$store.state.connectionResults.map((connection, index) => {
            if (index !== opened) {
                return index;
            } else {
                return null;
            }
        });
    }
      
    updateTarget(index: number, connectionSettings: ConnectionSettings) {
        this.settingsShowed = false;
        this.$store.commit(Mutations.updateConnectionSettings, {index: index, connectionSettings: connectionSettings});
        this.$router.push('/dashboard?' + this.$store.getters.connectionsAsParams);
    }

    deleteSettings(index: number) {
        this.$store.commit(Mutations.deleteConnectionSettings, index);
        this.$router.push('/dashboard?' + this.$store.getters.connectionsAsParams);
    }
}
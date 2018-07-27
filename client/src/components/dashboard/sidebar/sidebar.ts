import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { ConnectionSettings, ConnectionResult } from '../../../models/connectionSettings';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { setTimeout } from 'timers';
import { StatisticsService } from '../../../services/statisticsService';
import { Mutations } from '../../../store.vuex';
import './sidebar.scss';

const connectionStatusComponent = () => import('./connection-status').then(({ ConnectionStatusComponent }) => ConnectionStatusComponent);
const engineGroupComponent = () => import('./engine-group').then(({EngineGroupComponent}) => EngineGroupComponent);
const configComponent = () => import('./config').then(({ ConfigComponent }) => ConfigComponent);

@Component({
    template: require('./sidebar.html'),
    services: ['eventHub', 'statisticsService'],
    components: {
        'connection-status': connectionStatusComponent,
        'group': engineGroupComponent,
        'scroll': VuePerfectScrollbar,
        'config': configComponent
    }
})
export class SidebarComponent extends Vue {
    private eventHub: Vue = this.$services.eventHub;
    drawer = null;
    miniVariant = false;
    settingsShowed = false;
    connected = false;
    closeAllEngines = false;
    selectConnectionsToClose = [];
    clickAllowed = true;
    collectingData: boolean = false;
    emptyConnectionSettings = null;
    
    private statisticsService: StatisticsService = this.$services.statisticsService;

    get getOverviewPath() {
        return ('/dashboard/overview/' + '?' + this.$store.getters.connectionsAsParams);
    }
    get getAuditTrailPath() {
        return ('/dashboard/audit-trail/' + '?' + this.$store.getters.connectionsAsParams);
    }

    mounted() {
        let settings = this.$store.state.user.settings;
        this.emptyConnectionSettings = new ConnectionSettings(settings.defaultHost, settings.defaultPort, settings.defaultJmxUsername, settings.defaultJmxPass);
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

    private triggerCloseAllEngines() {
        this.closeAllEngines = true;
        setTimeout(() => { 
            this.closeAllEngines = false;
        }, 1000);
    }

    private closeSelectConnections(opened: number) {
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
      
    private updateTarget(index: number, connectionSettings: ConnectionSettings) {
        this.settingsShowed = false;
        let connectionResult: ConnectionResult = new ConnectionResult(connectionSettings, [], [], null, true);
        this.$store.commit(Mutations.updateConnectionResult, {index: index, connectionResult: connectionResult});
        this.$store.commit(Mutations.updateConnectionSettings, {index: index, connectionSettings: connectionSettings});
        this.$router.push('/dashboard?' + this.$store.getters.connectionsAsParams);
    }

    private deleteSettings(index: number) {
        this.$store.commit(Mutations.deleteConnectionSettings, index);
        this.$router.push('/dashboard?' + this.$store.getters.connectionsAsParams);
    }
}
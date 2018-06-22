import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { ConnectionSettings, ConnectionResult } from '../../models/connectionSettings';
import { JmxService } from '../../services/jmxService';
import * as utils from '../../util/utils';
import './dashboard.scss';
import { EngineStatus } from '../../models/engine';
import { User } from '../../models/user';
import { MBean } from '../../models/mbeans';
import * as _ from 'lodash';
import { Mutations } from '../../store.vuex';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { Notification } from '../../models/notification';
import { StatisticsService } from '../../services/statisticsService';

const sidebarComponent = () => import('./sidebar').then(({ SidebarComponent }) => SidebarComponent);

export class BeanContext {
    constructor(
        public beanName: string,
        public engineName: string
    ) {}
}

export class BeanConflict {
    public beanName: string;
    public conflictEngines: string[];
}

@Component({
    template: require('./dashboard.html'),
    services: ['jmxService', 'eventHub', 'statisticsService'],
    components: {
        'sidebar': sidebarComponent,
        'scroll': VuePerfectScrollbar
    }
})
export class DashboardComponent extends Vue {
    private eventHub: Vue = this.$services.eventHub;
    private statisticsService: StatisticsService = this.$services.statisticsService;
    interval: any;
    menuOpen: boolean = false;
    update: number;
    themeSwitch: boolean = true;
    initComplete: boolean = false;
    
    get user() {
        return this.$store.state.user;
    }
    get connectionSettings() {
        return this.$store.state.connectionSettings;
    }
    get getOverviewPath() {
        let params = '?' + this.$store.getters.connectionsAsParams;
        return ('/dashboard/overview/' + params);
    }

    created() {
        this.initComplete = false;
        this.getTheme();
        this.getPeriodSettings();
        this.menuOpen = false;
        (this.$services.eventHub as Vue).$on('forceStatusFetch', this.forceFetchingStatus);
    }

    mounted() {  
        this.parseRoute();
        this.sheduleFetchingStatus();
        this.statisticsService.init();
    }
    
    beforeDestroy() {
        this.statisticsService.destroy();
        clearInterval(this.interval);
        (this.$services.eventHub as Vue).$off('forceStatusFetch', this.forceFetchingStatus);
    }

    getTheme() {
        this.themeSwitch = this.$store.state.user.settings.darkTheme;
    }

    getPeriodSettings() {
        this.update = this.$store.state.user.settings.updatePeriod;
    }

    setUpdate() {
        localStorage.setItem(this.$store.state.user.name + ':updatePeriod', String(this.update));
        this.$store.state.user.settings.updatePeriod = this.update;
    }

    forceInt(data: any) {
        if (typeof data === 'number') {
            return data;
        } else {
            return parseInt(data);
        }
    }

    // @Watch('$route')
    parseRoute() {
        if (this.$route.fullPath.split('?').length <= 1 ) 
            return;

        let params = this.$route.fullPath.split('?');
        if (!params || !params[1]) 
            return;
        
        params = decodeURI(params[1]).split('&');
        if (!params)
            return;
        
        let settings: ConnectionSettings[] = [];
        params.forEach(connection => {
            let parsed = connection.split('=');

            if (parsed && parsed[0] === 'connection') {
                parsed = parsed[1].split('|');
                
                if (parsed[0] && parsed[1]) {
                    let username = this.$store.state.user.settings.defaultJmxUsername;
                    let password = this.$store.state.user.settings.defaultJmxPass;
                    let connection = new ConnectionSettings(parsed[0], parsed[1]);
                    
                    try {
                        let lsConnection = JSON.parse(localStorage.getItem(this.$store.state.user.name + '_' + connection.toString()));
                        if (lsConnection) {
                            username = lsConnection.username;
                            password = lsConnection.password;
                        }
                    } catch (err) {}

                    settings.push(new ConnectionSettings(parsed[0], parsed[1], username, password));
                }
            }
        });

        if (settings.length > 0) {
            this.$store.commit(Mutations.setConnectionSettings, settings);
        }
    }

    logout() {
        this.$store.commit(Mutations.setUser, null);
        this.$store.commit(Mutations.setConnectionSettings, []);
        this.$router.replace('/login'); 
    }

    @Watch('themeSwitch')
    toggleTheme() {
        localStorage.setItem('darkTheme', String(this.themeSwitch));
        localStorage.setItem(this.$store.state.user.name + ':darkTheme', String(this.themeSwitch));
        this.$store.commit(Mutations.updateTheme, this.themeSwitch);
    }

    @Watch('$store.state.connectionSettings')
    sheduleFetchingStatus() {
        if (this.$store.state.connectionSettings.length === 0) {
            if (this.interval) {
                clearInterval(this.interval);
            }
            this.$store.commit(Mutations.updateEngineStatus, []);
            this.$store.commit(Mutations.updateConnectionResults, []);

            return;
        }

        (this.$services.jmxService as JmxService)
                .getConnectionResults(this.$store.state.connectionSettings, this.$store.state.user)
                .then((results: ConnectionResult[]) => {
            let notConnected: ConnectionResult;
            if (results) {
                if (this.$store.state.appCriticalError) {
                    this.$store.commit(Mutations.setAppCriticalError, null);
                }
                this.$store.commit(Mutations.updateConnectionResults, results);
                
                if (this.interval) {
                    clearInterval(this.interval);
                }
                
                if (this.$store.getters.engineMBeans && this.$store.getters.engineMBeans.length > 0) {
                    this.getEngineStatus(this.$store.getters.engineMBeans, this.$store.state.user);
                    this.interval = setInterval(() => {
                        this.getEngineStatus(this.$store.getters.engineMBeans, this.$store.state.user);
                    }, this.$store.getters.updatePeriod * 1000);
                }  else {
                    this.$store.commit(Mutations.updateEngineStatus, []);
                }
                
                notConnected = results.find((conResult: ConnectionResult) => {
                    return !conResult.mbeans || conResult.mbeans.length === 0;
                });
            }
                
            if (!results || notConnected) {
                if (!results) {
                    console.error('Received no connection results in response. Perhaps issue with connection to server with Jolokia.\n Will schuedule refetching MBeans in three seccond');
                    this.$store.commit(Mutations.setAppCriticalError, 'Received no connection results in response. Perhaps issue with connection to server with Jolokia.');
                }

                if (notConnected) {
                    console.error(`Received no connection to ${notConnected.settings.host}:${notConnected.settings.port}. Will schuedule refetching MBeans in three seccond`);
                }

                setTimeout(() => {
                    this.sheduleFetchingStatus();
                }, 3000);
            }

            if (this.$store.state.appCriticalError) {
                this.$store.commit(Mutations.setAppCriticalError, null);
            }
        }).catch((error: Error) => {
            let errorMessage = 'Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error making JMX connection:' + error.message;
            console.error(errorMessage);
            this.$store.commit(Mutations.setAppCriticalError, errorMessage);
        });
    }

    forceFetchingStatus(delay: number = 0) {
        setTimeout(() => {
            this.getEngineStatus(this.$store.getters.engineMBeans, this.$store.state.user);
        }, delay);
    }

    private getEngineStatus(mbeans: MBean[], user: User) {
        (this.$services.jmxService as JmxService).getEngineStatus(mbeans, user).then((engineStatusList: EngineStatus[]) => {
            if (!engineStatusList) {
                engineStatusList = [];
                if (this.interval) {
                    clearInterval(this.interval);
                }
                
                this.sheduleFetchingStatus();
            }
            
            if (this.$store.state.appCriticalError) {
                this.$store.commit(Mutations.setAppCriticalError, null);
            }
            this.$store.commit(Mutations.updateEngineStatus, engineStatusList);
            this.initComplete = true;
        }).catch((error: Error) => {
            let errorMessage;
            if (error.message && error.message.indexOf('DBStorage') >= 0) {
                errorMessage = 'You probably haven\'t set DBStorage MBean correctly in JMXExporter of your application. JMX error: ' + error.message;
            } else {
                errorMessage = 'Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Engine Status:', error.message;
            }
            this.$store.commit(Mutations.setAppCriticalError, errorMessage);
            console.error(errorMessage);
        });
    }
}
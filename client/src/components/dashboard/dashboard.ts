import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { ConnectionSettings, ConnectionResult } from '../../models/connectionSettings';
import { JmxService } from '../../services/jmxService';
import * as utils from '../../util/utils';
import './dashboard.scss';
import { EngineStatus } from '../../models/engine';
import { User } from '../../models/user';
import { MBeans, MBean } from '../../models/mbeans';
import * as _ from 'lodash';
import { Mutations } from '../../store.vuex';

const sidebarComponent = () => import('./sidebar').then(({ SidebarComponent }) => SidebarComponent);

@Component({
    template: require('./dashboard.html'),
    services: ['jmxService', 'eventHub'],
    components: {
        'sidebar': sidebarComponent,
    }
})
export class DashboardComponent extends Vue {
    interval: any;
    menuOpen: boolean = false;
    periods: number[] = [];
    // currentFetch: string = '0';
    // currentUpdate: string = '0';
    compareInterval: any;
    themeSwitch: boolean = this.$store.state.darkTheme;
    
    get user() {
        return this.$store.state.user;
    }
    get connectionSettings() {
        return this.$store.state.connectionSettings;
    }

    created() {
        this.getTheme();
        this.getPeriodSettings();
        this.menuOpen = false;
        (this.$services.eventHub as Vue).$on('forceStatusFetch', this.forceFetchingStatus);
    }

    mounted() {  
        this.parseRoute();
        this.sheduleFetchingStatus();
    }
        
    beforeDestroy() {
        clearInterval(this.interval);
        (this.$services.eventHub as Vue).$off('forceStatusFetch', this.forceFetchingStatus);
    }

    getTheme() {
        this.themeSwitch = this.$store.state.darkTheme;
    }

    toggleTheme() {
        this.$store.commit(Mutations.updateTheme, !this.$store.state.darkTheme);
    }

    logout() {
        this.$store.commit(Mutations.setUser, null);
        this.$router.replace('/login'); 
    }

    getPeriodSettings() {
        if (localStorage.getItem('updatePeriod') === null) {
            this.periods[1] = this.$store.getters.updatePeriod;
        } else {
            this.periods[1] = parseInt(localStorage.getItem('updatePeriod'));
        }
        if (localStorage.getItem('fetchPeriod') === null) {
            this.periods[0] = this.$store.state.connectionSettings[0].fetchPeriod;
        } else {
            this.periods[0] = parseInt(localStorage.getItem('fetchPeriod'));
        }
    }

    setPeriods(periods: number[]) {
        localStorage.setItem('fetchPeriod', String(this.periods[0]));
        localStorage.setItem('updatePeriod', String(this.periods[1]));
        let settings = new ConnectionSettings(this.connectionSettings.host, this.connectionSettings.port, this.forceInt(this.periods[0]), this.forceInt(this.periods[1]));
        this.$store.commit(Mutations.updateConnectionSettings, {index: 0, connectionSettings: settings});
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
        if (this.$route.fullPath.split('?').length > 1 ) {
            let params = this.$route.fullPath.split('?');
            if (params && params[1]) {
                params = decodeURI(params[1]).split('&');
                if (params) {
                    let settings: ConnectionSettings[] = [];
                    params.forEach(connection => {
                        let parsed = connection.split('=');

                        if (parsed && parsed[0] === 'connection') {
                            parsed = parsed[1].split('|');
                            
                            if (parsed[0] && parsed[1]) {
                                settings.push(new ConnectionSettings(parsed[0], parsed[1]));
                            }
                        }
                    });

                    if (settings.length > 0) {
                        // this.$store.commit(Mutations.setConnectionSettings, settings);
                        this.$store.commit(Mutations.setConnectionSettings, settings);
                    }
                }
            }
        }
    }

    @Watch('themeSwitch')
    checkToggleTheme() {
        this.$store.commit(Mutations.updateTheme, this.themeSwitch);
    }

    @Watch('periods')
    checkNewPeriodSettings() {
        clearTimeout(this.compareInterval);
        this.compareInterval = setTimeout(() => {
            this.setPeriods(this.periods);
        }, 2000);
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
                    console.error('Got no connection results in response. Perhaps issue with connection to server with Jolokia.\n Will schuedule refetching MBeans in three seccond');
                    this.$store.commit(Mutations.setAppCriticalError, 'Got no connection results in response. Perhaps issue with connection to server with Jolokia.');
                }

                if (notConnected) {
                    console.error(`Got no connection to ${notConnected.settings.host}:${notConnected.settings.port}. Will schuedule refetching MBeans in three seccond`);
                }

                setTimeout(() => {
                    this.sheduleFetchingStatus();
                }, 3000);
            }
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

            this.$store.commit(Mutations.updateEngineStatus, engineStatusList);
        });
    }
}
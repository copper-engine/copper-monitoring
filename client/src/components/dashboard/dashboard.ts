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
    updateStatusInterval: any;
    menuOpen: boolean = false;
    periods: number[] = [];
    compareInterval: any;
    
    get user() {
        return this.$store.state.user;
    }
    get connectionSettings() {
        return this.$store.state.connectionSettings;
    }

    created() {
        this.periods[0] = this.connectionSettings.fetchPeriod;
        this.periods[1] = this.connectionSettings.updatePeriod;
        this.menuOpen = false;
        (this.$services.eventHub as Vue).$on('forceStatusFetch', this.forceFetchingStatus);
    }

    mounted() {  
        this.parseRoute();
        this.sheduleFetchingStatus();
    }
        
    beforeDestroy() {
        clearInterval(this.updateStatusInterval);
        (this.$services.eventHub as Vue).$off('forceStatusFetch', this.forceFetchingStatus);
    }


    toggleTheme() {
        this.$store.commit(Mutations.updateTheme, !this.$store.state.darkTheme);
    }

    logout() {
        this.$store.commit(Mutations.setUser, null);
        this.$router.replace('/login'); 
    }

    setPeriods(periods: number[]) {
        let settings = new ConnectionSettings(this.connectionSettings.host, this.connectionSettings.port, this.periods[0], this.periods[1]);
        this.$store.commit(Mutations.updateConnectionSettings, settings);
    }

    @Watch('periods')
    checkNewPeriodSettings() {
        clearTimeout(this.compareInterval);
        this.compareInterval = setTimeout(() => {
            this.setPeriods(this.periods);
        }, 2000);
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

    @Watch('$store.state.connectionSettings')
    sheduleFetchingStatus() {
        if (this.$store.state.connectionSettings.length === 0) {
            if (this.updateStatusInterval) {
                clearInterval(this.updateStatusInterval);
            }
            this.$store.commit(Mutations.updateEngineStatus, []);
            this.$store.commit(Mutations.updateConnectionResults, []);
            return;
        }

        (this.$services.jmxService as JmxService)
        .getConnectionResults(this.$store.state.connectionSettings, this.$store.state.user)
        .then((results: ConnectionResult[]) => {
            this.$store.commit(Mutations.updateConnectionResults, results);

            if (this.updateStatusInterval) {
                clearInterval(this.updateStatusInterval);
            }

            if (this.$store.getters.engineMBeans && this.$store.getters.engineMBeans.length > 0) {
                this.getEngineStatus(this.$store.getters.engineMBeans, this.$store.state.user);
                this.updateStatusInterval = setInterval(() => {
                    this.getEngineStatus(this.$store.getters.engineMBeans, this.$store.state.user);
                }, this.$store.state.connectionSettings[0].updatePeriod * 1000);
            } else {
                this.$store.commit(Mutations.updateEngineStatus, []);
            }
        });
    }

    forceFetchingStatus(delay: number = 0) {
        setTimeout(() => {
            this.getEngineStatus(this.$store.getters.engineMBeans, this.$store.state.user);
        }, delay);
    }

    private getEngineStatus(mbeans: MBean[], user: User) {
        (this.$services.jmxService as JmxService).getEngineStatus(mbeans, user).then((enginStatusList: EngineStatus[]) => {
            if (!enginStatusList) {
                enginStatusList = [];
            }

            this.$store.commit(Mutations.updateEngineStatus, enginStatusList);
        });
    }
}
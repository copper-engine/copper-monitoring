import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { ConnectionSettings, ConnectionResult } from '../../models/connectionSettings';
import { JmxService } from '../../services/jmxService';
import * as utils from '../../util/utils';
import './dashboard.scss';
import { EngineStatus } from '../../models/engine';
import { User } from '../../models/user';
import { MBeans, MBean } from '../../models/mbeans';
import * as _ from 'lodash';

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

    toggleTheme() {
        this.$store.commit('updateTheme', !this.$store.state.darkTheme);
    }
    
    get user() {
        return this.$store.state.user;
    }

    created() {  
        (this.$services.eventHub as Vue).$on('forceStatusFetch', this.forceFetchingStatus);
    }
        
    beforeDestroy() {
        clearInterval(this.updateStatusInterval);
        (this.$services.eventHub as Vue).$off('forceStatusFetch', this.forceFetchingStatus);
    }

    mounted() {

        this.parseRoute();
        this.sheduleFetchingStatus();
    }

    logout() {
        this.$store.commit('setUser', null);
        this.$router.replace('/login'); 
    }

    @Watch('$route')
    parseRoute() {
        // if (this.$route.fullPath.split('?').length > 1 ) {
        //     let params = this.$route.fullPath.split('?');
        //     if (params && params[1]) {
        //         console.log('decodeURI(params[1])', decodeURI(params[1]));
        //         params = decodeURI(params[1]).split('&');
        //         if (params && params[0]) {
        //             params = params[0].split('=');
        //             params = params[1].split('|');
        //             let settings: ConnectionSettings[] = this.$store.state.connectionSettings;
        //             let host: string = params[0] ? params[0] : settings.host;
        //             let port: string = params[1] ? params[1] : settings.port;
    
        //             if (host !== settings.host || port !== settings.port) {
        //                 this.$store.commit('updateConnectionSettings', new ConnectionSettings(host, port, settings.fetchPeriod, settings.updatePeriod));
        //             }
        //         }
        //     }
        // }
    }

    @Watch('$store.state.connectionSettings')
    sheduleFetchingStatus() {
        (this.$services.jmxService as JmxService)
        .getConnectionResults(this.$store.state.connectionSettings, this.$store.state.user)
        .then((results: ConnectionResult[]) => {
            console.log('getConnectionResults', results);
            this.$store.commit('updateConnectionResults', results);

            if (this.updateStatusInterval) {
                clearInterval(this.updateStatusInterval);
            }

            let mbeans: MBean[] = _.flatMap(results.map(result => result.mbeans ));
            if (mbeans && mbeans.length > 0) {
                this.$store.commit('updateMBeans', new MBeans(mbeans));
                this.getEngineStatus(mbeans, this.$store.state.user);
                this.updateStatusInterval = setInterval(() => {
                    this.getEngineStatus(mbeans, this.$store.state.user);
                }, this.$store.state.connectionSettings.updatePeriod * 1000);
            } else {
                // this.$store.commit('updateMBeans', new MBeans([]));
                // this.$store.commit('updateEngineStatus', []);
                // this.getMBeans(this.$store.state.connectionSettings, this.$store.state.user);
                // this.updateStatusInterval = setInterval(() => {
                //     this.getMBeans(this.$store.state.connectionSettings, this.$store.state.user);
                // }, this.$store.state.connectionSettings.updatePeriod * 1000);
            }
        });
    }

    forceFetchingStatus(delay: number = 0) {
        setTimeout(() => {
            this.getEngineStatus(this.$store.state.mbeans, this.$store.state.user);
        }, delay);
    }


    private getEngineStatus(mbeans: MBean[], user: User) {
        (this.$services.jmxService as JmxService).getEngineStatus(mbeans, user).then((enginStatusList: EngineStatus[]) => {
            if (!enginStatusList) {
                enginStatusList = [];
            }

            this.$store.commit('updateEngineStatus', enginStatusList);
        });
    }

    // private getMBeans(connectionSettings: ConnectionSettings, user: User) {
    //     (this.$services.jmxService as JmxService).getMBeans(this.$store.state.connectionSettings, this.$store.state.user).then((mbeans: MBean[]) => {
    //         if (mbeans && mbeans.length > 0) {
    //             this.$store.commit('updateMBeans', new MBeans(mbeans));
    //         } else {
    //             this.$store.commit('updateMBeans', new MBeans([]));
    //         }
    //    });
    // }
}
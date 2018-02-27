import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { ConnectionSettings } from '../../models/connectionSettings';
import { JmxService } from '../../services/jmxService';
import * as utils from '../../util/utils';
import './dashboard.scss';
import { EngineStatus } from '../../models/engine';
import { User } from '../../models/user';

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
    darkThemeText = utils.parseBoolean(localStorage.getItem('darkTheme'));
    // darkThemeText = false;

    toggleTheme() {
        this.$emit('toggle-theme');
        this.darkThemeText = !this.darkThemeText;
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
        if (this.$route.fullPath.split('?').length > 1 ) {
            let params = this.$route.fullPath.split('?');
            if (params && params[1]) {
                params = params[1].split('&');
                let host: string = params[0] ? params[0].split('=')[1] : undefined;
                let port: string = params[1] ? params[1].split('=')[1] : undefined;

                if (host || port) {
                    this.$store.commit('updateConnectionSettings', new ConnectionSettings(host, port));
                }
            }
        }
    }

    @Watch('$store.state.connectionSettings')
    sheduleFetchingStatus() {
        console.log('connectionSettings changed:', this.$store.state.connectionSettings.host, this.$store.state.connectionSettings.port );

        (this.$services.jmxService as JmxService)
        .getMBeans(this.$store.state.connectionSettings, this.$store.state.user)
        .then((mbeanNames: string[]) => {

            if (this.updateStatusInterval) {
                clearInterval(this.updateStatusInterval);
            }

            let connectionSettings: ConnectionSettings = this.$store.state.connectionSettings;
            if (mbeanNames && mbeanNames.length === 2) {
                connectionSettings.setEngineMBean(mbeanNames[0]);
                connectionSettings.setwfRepoMBean(mbeanNames[1]);
            }

            this.$store.commit('updateConnectionSettings', connectionSettings);

            console.log('getEngineStatus: ', this.$store.state.connectionSettings.host, this.$store.state.connectionSettings.port );
            this.getEngineStatus(connectionSettings, this.$store.state.user);
            this.updateStatusInterval = setInterval(() => {
                console.log('interval getEngineStatus: ', this.$store.state.connectionSettings.host, this.$store.state.connectionSettings.port );
                this.getEngineStatus(this.$store.state.connectionSettings, this.$store.state.user);
            }, this.$store.state.connectionSettings.updatePeriod * 1000);
        });
    }

    forceFetchingStatus(delay: number = 0) {
        setTimeout(() => {
            this.getEngineStatus(this.$store.state.connectionSettings, this.$store.state.user);
        }, delay);
    }

    private getEngineStatus(connectionSettings: ConnectionSettings, user: User) {
        (this.$services.jmxService as JmxService).getEngineStatus(connectionSettings, user).then((response: EngineStatus) => {
            this.$store.commit('updateEngineStatus', response);
        });
    }
}
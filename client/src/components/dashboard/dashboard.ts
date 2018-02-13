import { Component, Vue, Watch } from 'vue-property-decorator';
import { ConnectionSettings } from '../../models/connectionSettings';
import { JmxService } from '../../services/jmxService';

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
        console.log('Dashboard mounted', new Date());
        this.sheduleFetchingStatus();
    }

    logout() {
        this.$store.commit('setUser', null);
        this.$router.replace('/login'); 
    }

    @Watch('$store.state.connectionSettings')
    sheduleFetchingStatus() {
        if (this.updateStatusInterval) {
            clearInterval(this.updateStatusInterval);
        }
        this.getEngineStatus(this.$store.state.connectionSettings, this.$store.state.user);
        this.updateStatusInterval = setInterval(() => {
            this.getEngineStatus(this.$store.state.connectionSettings, this.$store.state.user);
        }, this.$store.state.connectionSettings.updatePeriod * 1000);
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
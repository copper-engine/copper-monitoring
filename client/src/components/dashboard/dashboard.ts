import { Component, Vue, Watch } from 'vue-property-decorator';
import { ConnectionSettings } from '../../models/connectionSettings';
import { JmxService } from '../../services/jmxService';

import './dashboard.scss';
import { EngineStatus } from '../../models/engine';

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
    
    created() {  
        (this.$services.eventHub as Vue).$on('forceStatusFetch', this.forceFetchingStatus);
    }
        
    beforeDestroy() {
        clearInterval(this.updateStatusInterval);
        (this.$services.eventHub as Vue).$off('forceStatusFetch', this.forceFetchingStatus);
    }

    mounted() {
        this.sheduleFetchingStatus();
    }

    @Watch('$store.state.connectionSettings')
    sheduleFetchingStatus() {
        console.log('sheduleFetchingStatus');
        if (this.updateStatusInterval) {
            clearInterval(this.updateStatusInterval);
        }
        this.getEngineStatus(this.$store.state.connectionSettings);
        this.updateStatusInterval = setInterval(() => {
            this.getEngineStatus(this.$store.state.connectionSettings);
        }, this.$store.state.connectionSettings.updatePeriod * 1000);
    }

    forceFetchingStatus(delay: number = 0) {
        setTimeout(() => {
            this.getEngineStatus(this.$store.state.connectionSettings);
        }, delay);
    }

    private getEngineStatus(connectionSettings: ConnectionSettings) {
        (this.$services.jmxService as JmxService).getEngineStatus(connectionSettings).then((response: EngineStatus) => {
            this.$store.commit('updateEngineStatus', response);
        });
    }
}
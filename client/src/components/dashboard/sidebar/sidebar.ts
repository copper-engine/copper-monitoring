import { Component, Vue, Prop } from 'vue-property-decorator';
import { Link } from '../../../models/link';
import { ConnectionSettings } from '../../../models/connectionSettings';
import './sidebar.scss';

const statusComponent = () => import('./status').then(({ StatusComponent }) => StatusComponent);
const configComponent = () => import('./config').then(({ ConfigComponent }) => ConfigComponent);

@Component({
    template: require('./sidebar.html'),
    components: {
        'status': statusComponent,
        'config': configComponent,
    }
})
export class SidebarComponent extends Vue {
    drawer = null;
    miniVariant = false;
    settingsShowed = false;
    links: Link[] = [
        new Link('Home', '/dashboard', 'mdi-home'),
        new Link('Broken Workflows', '/dashboard/workflows', 'mdi-image-broken'),
      ];
      
      updateTarget(connectionSettings) {
          this.settingsShowed = false;
          this.$store.commit('updateConnectionSettings', connectionSettings);
      }
}
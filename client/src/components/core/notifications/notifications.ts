import { Component, Vue, Prop } from 'vue-property-decorator';
import { Notification } from '../../../models/notification';

@Component({
    template: require('./notifications.html'),
    services: ['jmxService', 'eventHub']
})
export class NotificationsComponent extends Vue {
    notifications: Notification[] = [];

    created() {
        (this.$services.eventHub as Vue).$on('showNotification', this.showNotification);
    }

    beforeDestroy() {
        (this.$services.eventHub as Vue).$off('showNotification', this.showNotification);
    }

    private showNotification(notification: Notification) {
        this.notifications.push(notification);
        this.notifications = this.notifications.filter((notification) => notification.snackbar);
    }

}
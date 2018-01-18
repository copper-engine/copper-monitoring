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
        
        // this.notifications.push(new Notification('test notyfication'));
        
        // setTimeout(() => {
            //     this.notifications.push(new Notification('Something terrible just happend', 'error', 10000));
            // }, 1000);
    }

    beforeDestroy() {
        (this.$services.eventHub as Vue).$off('showNotification', this.showNotification);
    }

    private showNotification(notification: Notification) {
        this.notifications.push(notification);
        this.notifications = this.notifications.filter((notification) => notification.snackbar);

        console.log('total number of notifications is: ', this.notifications.length);
    }

}
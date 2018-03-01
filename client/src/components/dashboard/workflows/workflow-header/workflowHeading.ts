import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

@Component({
    template: require('./workflowHeading.html'),
})
export class WorkflowHeading extends Vue {
    @Prop() engineStatus;
    @Prop() restartingAll: boolean;
    @Prop() deletingAll: boolean;
    openFilterMenu: boolean = false;

    sendRestartAll() {
        this.$emit('triggerRestartAll');
    }

    sendDeleteAll() {
        this.$emit('triggerDeleteAll');
    }

    sendFilterMenu() {
        this.$emit('triggerFilterMenu');
        this.openFilterMenu = !this.openFilterMenu;
    }
}
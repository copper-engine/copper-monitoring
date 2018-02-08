import { Vue, Component } from 'vue-property-decorator';

@Component({
    template: require('./workflowHeading.html'),
})
export class WorkflowHeading extends Vue {

    sendRestartAll() {
        this.$emit('triggerRestartAll');
    }

    sendDeleteAll() {
        this.$emit('triggerDeleteAll');
    }
}
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component({
    template: require('./workflowHeading.html'),
})
export class WorkflowHeading extends Vue {
    @Prop() engineStatus;
    
    sendRestartAll() {
        this.$emit('triggerRestartAll');
    }

    sendDeleteAll() {
        this.$emit('triggerDeleteAll');
    }
}
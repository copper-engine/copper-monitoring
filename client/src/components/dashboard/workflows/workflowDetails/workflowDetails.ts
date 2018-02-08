import { Vue, Component } from 'vue-property-decorator';


@Component({
    template: require('./workflowDetails.html'),
    components: {
    }
})
export class WorkflowDetail extends Vue {
    testVar: String = 'test';
}
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

@Component({
    template: require('./workflow-footer.html'),
})
export class WorkflowFooter extends Vue {
    @Prop() page: Number;
    @Prop() perPage: Number;
    @Prop() totalPages: Number;
    @Prop() perPageItems: Number[];

    localPage = this.page;
    localPerPage = this.perPage;

    @Watch('localPage')
    pageChange(value) {
        this.$emit('updatePage', value);
    }
    @Watch('localPerPage')
    perPageChange(value) {
        this.$emit('updatePerPage', value);
    }
}
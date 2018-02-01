import { Component, Vue } from 'vue-property-decorator';
import { Logger } from '../../../util/log';

@Component({
    template: require('./about.html')
})
export class AboutComponent extends Vue {

    protected logger: Logger;
    repo: string = 'https://github.com/ducksoupdev/vue-webpack-typescript';

    mounted() {
        if (!this.logger) this.logger = new Logger();
        this.$nextTick(() => this.logger.info('about is ready!'));
    }
}

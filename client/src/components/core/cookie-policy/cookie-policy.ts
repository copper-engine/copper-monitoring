import { Component, Vue } from 'vue-property-decorator';
import './cookie-policy.scss';

@Component({
    template: require('./cookie-policy.html'),
})
export class CookiePolicyComponent extends Vue {
    showMore: boolean = false;
    showCookiesPolicy: boolean = false;
    private lsKey = this.$store.state.user.name + ':acceptCookies';

    mounted() {
        try {
            let acceptCookies = JSON.parse(localStorage.getItem(this.lsKey));
            if (!acceptCookies) {
                this.showCookiesPolicy = true;
            }
        } catch (err) {
            this.showCookiesPolicy = true;
        }
    }

    acceptCookies() {
        this.showCookiesPolicy = false;
        localStorage.setItem(this.lsKey, String(true));
    }
}
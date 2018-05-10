import Axios from 'axios';
import * as utils from '../../util/utils';
import { Component, Vue, Prop } from 'vue-property-decorator';
import { User, UserSettings } from '../../models/user';
import { CopperRouter } from '../../router';
import { Mutations } from '../../store.vuex';
import './login.scss';

@Component({
    template: require('./login.html'),
})
export class LoginComponent extends Vue {
    valid = true;
    username: string = '';
    usernameRules = [ (v) => !!v || 'Username is required' ];
    password: string= '';
    passwordRules = [ (v) => !!v || 'Password is required' ];
    error: string = null;

    submit () {
        if (this.$store.state.user) {
            this.$router.push('/dashboard');
        } else {
            if ((this.$refs.form as any).validate()) {
                Axios.get(process.env.USER_API_NAME, {
                    auth: {username: this.username, password: this.password}
                }).then(result => {
                    if (result.status === 401) {
                        this.error = 'Username & Password combination is incorect.';
                    } else {
                        this.$store.commit(Mutations.setUser, new User(this.username, this.password, new UserSettings(result.data.host, result.data.port, this.update, this.fetch, this.theme)));
                        this.$router.push((this.$router as CopperRouter).nextPath);
                    }
                }).catch(error => {
                    this.error = 'Username & Password combination is incorect.';
                });            
            }
        }  
    }

    get update() {
        if (localStorage.getItem(this.username + ':updatePeriod')) {
            return parseInt(localStorage.getItem(this.username + ':updatePeriod'));
        } else {
            return 10;
        }
    }
    get fetch() {
        if (localStorage.getItem(this.username + ':fetchPeriod')) {
            return parseInt(localStorage.getItem(this.username + ':fetchPeriod'));
        } else {
            return 5;
        }
    }
    get theme() {
        if (localStorage.getItem(this.username + ':darkTheme')) {
            return utils.parseBoolean(localStorage.getItem(this.username + ':darkTheme'));
        } else {
            return true;
        }
    }
}
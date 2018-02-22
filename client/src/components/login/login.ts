import Axios from 'axios';

import { Component, Vue, Prop } from 'vue-property-decorator';
import { User, UserSettings } from '../../models/user';

import './login.scss';
import { CopperRouter } from '../../router';

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
        if ((this.$refs.form as any).validate()) {
            Axios.get(process.env.USER_API_NAME, {
                auth: {username: this.username, password: this.password}
            }).then(result => {
                if (result.status === 401) {
                    this.error = 'Username & Password combination is incorect.';
                } else {
                    this.$store.commit('setUser', new User(this.username, this.password, new UserSettings(result.data.host, result.data.port)));
                    this.$router.push((this.$router as CopperRouter).nextPath);
                }
            }).catch(error => {
                this.error = 'Username & Password combination is incorect.';
            });            
        }
    }
}
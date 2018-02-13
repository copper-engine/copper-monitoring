import Axios from 'axios';

import { Component, Vue, Prop } from 'vue-property-decorator';
import { User } from '../../models/user';

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
        if ((this.$refs.form as any).validate()) {
            Axios.get(process.env.API_NAME, {
                auth: {username: this.username, password: this.password}
            }).then(result => {
                if (result.status === 401) {
                    this.error = 'Username & Password combination is incorect.';
                } else {
                    this.$store.commit('setUser', new User(this.username, this.password));
                    this.$router.replace('dashboard'); 
                }
            }).catch(error => {
                this.error = 'Username & Password combination is incorect.';
                // console.error('ERROR catched', error);
            });            
        }
    }
}
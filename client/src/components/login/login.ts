import { Component, Vue, Prop } from 'vue-property-decorator';
import { User } from '../../models/user';

import './login.scss';

@Component({
    template: require('./login.html'),
})
export class LoginComponent extends Vue {
    valid = true;
    username: string = '';
    usernameRules = [
      (v) => !!v || 'Username is required'
    ];
    password: string= '';
    passwordRules = [
      (v) => !!v || 'Password is required',
    ];
    error: string = null;

    submit () {
        if ((this.$refs.form as any).validate()) {
            console.log('try to ligin');
            if (this.username === 'Bobby' && this.password === '1234') {
                console.log('Logged in as bobby');
                this.$store.commit('setUser', new User(this.username, '###FAKE_TOKEN###'));
                this.$router.replace('dashboard'); 

            } else {
                this.error = 'Incorect username & password combination';
            }



            // Native form submission is not yet supported
            // axios.post('/api/submit', {
            //     name: this.name,
            //     email: this.email,
            //     select: this.select,
            //     checkbox: this.checkbox
            // })
        }
    }

    clear () {
        (this.$refs.form as any).reset();
    }
}
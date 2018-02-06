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

            // if (this.username === 'Bobby' && this.password === '1234') {
            //     this.$store.commit('setUser', new User(this.username, '###FAKE_TOKEN###'));
            //     this.$router.replace('dashboard'); 
            // } else {
            //     this.error = 'Incorect username & password combination';
            // }

            // headers: { Authorization: 'Basic YWRtaW46YWRtaW4=' } 
            // Axios.get(process.env.API_NAME, {
            //     method: 'get',
            //     withCredentials: true,
            //     auth: {username: 'admin', password: 'admin'}
            //  }).then(result => {
            // Axios.post(process.env.API_NAME, {
            //     url: process.env.API_NAME,
            //     method: 'GET',
            //     headers: 
            //     {
            //         Authorization: 'Basic YWRtaW46YWRtaW4='
            //     }
            //  })
             
             Axios.request({
                method: 'get',
                url: process.env.API_NAME,

                auth: {
                  username: '',
                  password: 'YWRtaW46YWRtaW4='
                },
              }).then(result => {
                console.log('login result: ', result);

                if (result.status === 401) {
                    console.log('Unauthorized');
                } else {
                    console.log('Welcome ' + this.username);
                }

            }).catch(error => {
                console.log('ERROR catched');
            });

            // Native form submission is not yet supported
            // axios.post('/api/login', {
            //     name: this.name,
            //     email: this.email,
            //     select: this.select,
            //     checkbox: this.checkbox
            // })
        }
    }
}
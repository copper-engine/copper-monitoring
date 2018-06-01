import Axios from 'axios';
import * as utils from '../../util/utils';
import { Component, Vue, Prop } from 'vue-property-decorator';
import { User, UserSettings, InfluxConnection, ChartSettings } from '../../models/user';
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
    nextPath: string = null;
    defaultURL: string = '';
    defaultUsername: string = '';
    defaultPassword: string = '';
    

    submit () {
        if ((this.$router as CopperRouter).nextPath === '/login') {
            this.nextPath = '/dashboard';
        } else {
            this.nextPath = (this.$router as CopperRouter).nextPath;
        }
        
        if ((this.$refs.form as any).validate()) {
            Axios.get(process.env.USER_API_NAME, {
                auth: {username: this.username, password: this.password}
            }).then(result => {
                if (result.status === 401) {
                    this.error = 'Username & Password combination is incorect.';
                } else {
                    this.defaultURL = result.data.influxURL;
                    this.defaultUsername = result.data.influxUsername;
                    this.defaultPassword = result.data.influxPassword;                    
                    this.$store.commit(Mutations.setUser, new User(this.username, this.password, new UserSettings(result.data.host, result.data.port, this.update, this.theme),
                        new InfluxConnection(this.url, this.user, this.pass, this.use), new ChartSettings(this.chartInterval, this.chartLayout)));
                    this.$router.push(this.nextPath);
                }
            }).catch(error => {
                this.error = 'Username & Password combination is incorect.';
            });            
        }
    }

    get update() {
        if (localStorage.getItem(this.username + ':updatePeriod')) {
            return parseInt(localStorage.getItem(this.username + ':updatePeriod'));
        } else {
            return 10;
        }
    }
    get theme() {
        if (localStorage.getItem(this.username + ':darkTheme')) {
            return utils.parseBoolean(localStorage.getItem(this.username + ':darkTheme'));
        } else {
            return true;
        }
    }

    get url() {
        let storage = localStorage.getItem(this.username + ':influxURL');     
        if (storage !== null && storage !== '' && storage !== undefined) {
            return storage;
        }
        if (this.defaultURL !== null && this.defaultURL !== '' && this.defaultURL !== undefined) {
            return this.defaultURL;
        }
        else {
            return null;
        }
    }

    get user() {
        let storage = localStorage.getItem(this.username + ':influxUser');
        if (storage !== null && storage !== '' && storage !== undefined) {
            return storage;
        }
        if (this.defaultUsername !== null && this.defaultUsername !== '' && this.defaultUsername !== undefined) {
            return this.defaultUsername;
        }
        else {
            return null;
        }
    }

    get pass() {
        let storage = localStorage.getItem(this.username + ':influxPass');
        if (storage !== null && storage !== '' && storage !== undefined) {
            return storage;
        }
        if (this.defaultPassword !== null && this.defaultPassword !== '' && this.defaultPassword !== undefined) {
            return this.defaultPassword;
        }
        else {
            return null;
        }
    }

    get use() {
        let storage = localStorage.getItem(this.username + ':useInfluxDB');
        if (storage !== null && storage !== '' && storage !== undefined) {
            return utils.parseBoolean(storage);
        } else {
            return null;
        }
    }

    get chartInterval() {
        let storage = localStorage.getItem(this.username + ':chartInterval');
        if (storage !== null && storage !== undefined) {
            return parseInt(storage);
        } else {
            return null;
        }
    }

    get chartLayout() {
        let storage = localStorage.getItem(this.username + ':chartLayout');
        if (storage !== null && storage !== undefined) {
            return storage;
        } else {
            return null;
        }
    }
}
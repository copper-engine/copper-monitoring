import Axios, { AxiosResponse } from 'axios';
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
    defaultInfluxURL: string = '';
    defaultInfluxUsername: string = '';
    defaultInfluxPassword: string = '';    

    submit () {
        if ((this.$refs.form as any).validate()) {
            Axios.get(process.env.USER_API_NAME, {
                auth: {username: this.username, password: this.password}
            }).then(result => {
                if (result.status === 401) {
                    this.error = 'Username & Password combination is incorect.';
                } else {
                    this.processLogin(result);
                }
            }).catch(error => {
                this.error = 'Username & Password combination is incorect.';
            });            
        }
    }

    private processLogin(result: AxiosResponse) {
        this.defaultInfluxURL = result.data.influxURL;
        this.defaultInfluxUsername = result.data.influxUsername;
        this.defaultInfluxPassword = result.data.influxPassword;    

        let user = new User(this.username, this.password, 
            new UserSettings(result.data.host, result.data.port, result.data.jmxUsername, result.data.jmxPassword, this.update, this.theme), 
            new InfluxConnection (this.url, this.user, this.pass, this.useInfluxDB), 
            new ChartSettings(this.chartInterval, this.chartLayout));    

        this.$store.commit(Mutations.setUser, user);

        let nextPath = (this.$router as CopperRouter).nextPath;
        this.$router.push(nextPath === '/login' ? '/dashboard' : nextPath);
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
        if (storage) {
            return storage;
        }
        if (this.defaultInfluxURL !== null && this.defaultInfluxURL !== '' && this.defaultInfluxURL !== undefined) {
            return this.defaultInfluxURL;
        }
        else {
            return null;
        }
    }

    get user() {
        let storage = localStorage.getItem(this.username + ':influxUser');
        if (storage) {
            return storage;
        }

        return this.defaultInfluxUsername ? this.defaultInfluxUsername : null;
    }

    get pass() {
        let storage = localStorage.getItem(this.username + ':influxPass');
        if (storage) {
            return storage;
        }

        return this.defaultInfluxPassword ? this.defaultInfluxPassword : null;
    }
    
    get useInfluxDB() {
        let storage = localStorage.getItem(this.username + ':useInfluxDB');

        return storage ? utils.parseBoolean(storage) : null;
    }
    
    get chartInterval() {
        let storage = localStorage.getItem(this.username + ':chartInterval');
        return storage ? parseInt(storage) : null;
    }

    get chartLayout() {
        let storage = localStorage.getItem(this.username + ':chartLayout');
        return storage ? storage : null;
    }
}
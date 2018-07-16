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
    result: AxiosResponse;

    submit () {
        if ((this.$refs.form as any).validate()) {
            Axios.get(process.env.USER_API_NAME, {
                auth: {username: this.username, password: this.password}
            }).then(result => {
                if (result.status === 401) {
                    this.error = 'Username & Password combination is incorect.';
                } else {
                    this.result = result;             
                    this.processLogin();
                }
            }).catch(error => {
                if (error.response) {
                    this.error = error.response.status + ' : ' + error.response.statusText;
                } else {
                    this.error = 'Copper Monitoring Backend is not reachable';
                }
                if (!this.error) {
                    this.error = 'Username & Password combination is incorect.';
                }
            });            
        }
    }

    private processLogin() {
        this.defaultInfluxURL = this.result.data.influxURL;
        this.defaultInfluxUsername = this.result.data.influxUsername;
        this.defaultInfluxPassword = this.result.data.influxPassword;    

        let user = new User(this.username, this.password, 
            new UserSettings(this.result.data.host, this.result.data.port, this.jmxUser, this.jmxPass, this.update, this.theme), 
            new InfluxConnection (this.influxUrl, this.influxUser, this.influxPass, this.useInfluxDB), 
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
    private get theme() {
        if (localStorage.getItem(this.username + ':darkTheme')) {
            return utils.parseBoolean(localStorage.getItem(this.username + ':darkTheme'));
        } else {
            return true;
        }
    }

    private get influxUrl() {
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

    private get influxUser() {
        let storage = localStorage.getItem(this.username + ':influxUser');
        if (storage) {
            return storage;
        }

        return this.defaultInfluxUsername ? this.defaultInfluxUsername : '';
    }

    private get influxPass() {
        let storage = localStorage.getItem(this.username + ':influxPass');
        if (storage) {
            return storage;
        }

        return this.defaultInfluxPassword ? this.defaultInfluxPassword : '';
    }

    get jmxUser() {
        if (this.result.data.jmxUsername !== null && this.result.data.jmxUsername !== undefined && this.result.data.jmxUsername !== 'null') {
            return this.result.data.jmxUsername;
        } else {
            return '';
        }
    }

    get jmxPass() {  
        if (this.result.data.jmxPassword !== null && this.result.data.jmxPassword !== undefined && this.result.data.jmxPassword !== 'null') {        
            return this.result.data.jmxPassword;
        } else {
            return '';
        }
    }
    
    get useInfluxDB() {
        let storage = localStorage.getItem(this.username + ':useInfluxDB');
        return storage ? utils.parseBoolean(storage) : null;
    }
    
    get chartInterval() {
        let storage = localStorage.getItem(this.username + ':chartInterval');
        return storage ? parseInt(storage) : null;
    }

    private get chartLayout() {
        let storage = localStorage.getItem(this.username + ':chartLayout');
        return storage ? storage : null;
    }
}
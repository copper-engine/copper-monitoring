import { Component, Vue, Watch } from 'vue-property-decorator';
import { EngineGroup } from '../../../models/engine';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { Notification } from '../../../models/notification';
import * as _ from 'lodash';
import './overview.scss';

export class InfluxConnection {
    constructor(
        public host: string,
        public port: string,
        public username: string,
        public password: string
    ) {}
}

export class BeanContext {
    constructor(
        public beanName: string,
        public engineName: string
    ) {}
}

export class BeanConflict {
    public beanName: string;
    public conflictEngines: string[];
}

@Component({
    template: require('./overview.html'),
    services: ['jmxService', 'eventHub'],
    components: {
        'scroll': VuePerfectScrollbar
    }
})
export class Overview extends Vue {
    private eventHub: Vue = this.$services.eventHub;
    groups: EngineGroup[] = [];
    timeSelect: string[] = ['5 sec', '15 sec', '30 sec', '1 min', '5 min', '15 min'];
    layoutSelect: string[]= ['Row', 'Column'];
    newTime: string = '1 min';
    newLayout: string = 'Row'; 
    openOptions: boolean = false;
    fetchPeriod: number;
    fetchInterval: any;
    openInfluxDialog: boolean = false;
    influxConnection: InfluxConnection;
    port: string = '';
    host: string = '';
    username: string = '';
    password: string = '';
    configText: string = '';
    queryText: string = '';
    beanCollisions: BeanConflict[] = [];

    mounted() {
        this.getEngines();
    }

    beforeDestroy() {
        clearInterval(this.fetchInterval);
    }

    get getRow() {
        if (this.newLayout === 'Row') {
            return true;
        }
        else {
            return false;
        }
    }

    updateTime(time: string) {
        this.newTime = time;
        this.fetchPeriod = this.getTime();
        this.scheduleFetch();
    }

    getTime() {
        let timeSplit = this.newTime.split(' ');
        let multiplier = 1;
        if (timeSplit[1] === 'min') {
            multiplier = 60;
        }
        return parseInt(timeSplit[0]) * multiplier;
    }

    getName(group: EngineGroup) {
        if (group.engines.length > 1) {
            return group.name;
        } else {
            return group.engines[0].engineId;
        }
    }

    triggerOpenInflux() {
        this.generateConfigFile();
        this.generateSampleQueries();
        this.openInfluxDialog = true;
    }

    generateConfigFile() {

        let beanNames = [];

        this.configText = '[[inputs.jolokia2_proxy]]\n#url goes from process.env.API_NAME variable like in jmxService. credentials is current user\n' +
            '     url = "' + this.parseURL() + '"\n' +
            '     username = "' + this.$store.state.user.name + '"\n' +
            '     password = "' + this.$store.state.user.password + '"\n\n' +
            '#From connections\n';
       
        this.$store.state.connectionResults.map((connection) => {
            this.configText += '[[inputs.jolokia2_proxy.target]]\n' +
                '     url = "service:jmx:rmi:///jndi/rmi://' + connection.settings.host + ':' + connection.settings.port + '/jmxrmi"\n';
        });

        this.configText += '\n#From engines. Name made from connection name and engine name to prevent collisions\n';    
        this.$store.state.engineStatusList.map((engine, index) => {
            let bean = this.$store.getters.engineMBeans[engine.id];
            let name = this.parseBeanName(bean.name);
            // beanNames[index] = [bean.name, engine.engineId];
            beanNames[index] = new BeanContext(bean.name, engine.engineId);
            this.configText += '[[inputs.jolokia2_proxy.metric]]\n' +
                '     name = "' + engine.engineId + '@' + bean.connectionSettings.host + ':' + bean.connectionSettings.port + '"\n' +
                '     mbean = "' + bean.name + '"\n' +
                '     paths = [ "InvalidCount", "ErrorCount", "WaitingCount", "RunningCount", "FinishedCount", "DequeuedCount" ]\n\n';
        });
        this.checkBeanNameConflict(beanNames);
    }

    checkBeanNameConflict(beans) {
        let conflicts: BeanConflict[] = [];
        _.toPairs(_.groupBy(beans, 'beanName')).map((group) => {
            let conflict = new BeanConflict;
            conflict.beanName = group[0];
            conflict.conflictEngines = group[1].map((beanContext) => {
                return beanContext.engineName;
            });
            if (conflict.conflictEngines.length > 1) {
                conflicts.push(conflict);
            }
        });
        this.beanCollisions = conflicts;
    }

    generateSampleQueries() {
        this.queryText = '#Sample Queries\n\n';
        this.$store.getters.groupsOfEngines.map((group) => {

            let engine = group.engines[0];
            let bean = this.$store.getters.engineMBeans[engine.id];

            if (group.engines.length > 1) {
                this.queryText += '#Select Attributes for Group: ' + group.name + '@' + bean.connectionSettings.host + ':' + bean.connectionSettings.port + '\n';
            } else {
                this.queryText += '#Select Attributes for Engine: ' + engine.engineId + '@' + bean.connectionSettings.host + ':' + bean.connectionSettings.port + '\n';
            }

            this.queryText += 'SELECT' + '\nMAX("ErrorCount") AS "MAX_ErrorCount",' + '\nMAX("DequeuedCount") AS "MAX_DequeuedCount",' + '\nMAX("FinishedCount") AS "MAX_FinishedCount",' +
                '\nMAX("InvalidCount") AS "MAX_InvalidCount",' + '\nMAX("RunningCount") AS "MAX_RunningCount",' + '\nMAX("WaitingCount") AS "MAX_WaitingCount"' + 
                '\nFROM "telegraf"."autogen"."' + engine.engineId + '@' + bean.connectionSettings.host + ':' + bean.connectionSettings.port + '"' +
                '\nWHERE time > now() - 1h GROUP BY time(10s) FILL(null)\n\n';
        });
    }

    parseURL() {
        if (process.env.API_NAME.substr(0, 4) !== 'http') {
            let subUrl = window.location.href.substr(7);
            let endIndex = subUrl.indexOf('/');
            return window.location.href.substr(0, (endIndex + 7)) + process.env.API_NAME;
        } else {
            return process.env.API_NAME;
        }
    }

    parseBeanName(fullName: string) {
        return fullName.substr(19);
    }

    downloadConfig() {
        let blob = new Blob([this.configText], {type: 'text/csv'});
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, 'telegraf.conf');
        } else {
            let elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = 'telegraf.conf';        
            document.body.appendChild(elem);
            elem.click();        
            document.body.removeChild(elem);
        }
    }

    copy(text) {
        let elem = window.document.createElement('textarea');
        elem.value = text;
        document.body.appendChild(elem);
        elem.select();
        document.execCommand('copy');
        document.body.removeChild(elem);
        this.eventHub.$emit('showNotification', new Notification('Copied to Clipboard'));
    }

    submit() {
        this.openInfluxDialog = false;
        this.influxConnection = new InfluxConnection(this.host, this.port, this.username, this.password);
        console.log(this.influxConnection);
    }

    scheduleFetch() {
        if (this.fetchInterval) {
            clearInterval(this.fetchInterval);
        }
        this.getEngines();
        this.fetchInterval = setInterval(() => {
            this.getEngines();
        }, this.fetchPeriod * 1000);
    }

    getEngines() {
        this.groups = this.$store.getters.groupsOfEngines;
    }
}
import { Component, Vue, Watch } from 'vue-property-decorator';
import { StatesPrint, ChartStates, EngineGroup, EngineStatus } from '../../../models/engine';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { Notification } from '../../../models/notification';
import { InfluxDBService } from '../../../services/influxDBService';
import { StatisticsService } from '../../../services/statisticsService';
import { setTimeout } from 'timers';
import * as _ from 'lodash';
import './overview.scss';

const Stats = () => import('./stats').then(({ Stats }) => Stats);

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

export class TimeSelection {
    constructor(public label: string, public time: number) {}
}

export class EngineStatData {
    constructor(public name: string, public data: any[]) {}
}

@Component({
    template: require('./overview.html'),
    services: ['influxService', 'eventHub', 'statisticsService'],
    components: {
        'scroll': VuePerfectScrollbar,
        'stats': Stats
    }
})
export class Overview extends Vue {
    private eventHub: Vue = this.$services.eventHub;
    private statisticsService: StatisticsService = this.$services.statisticsService;
    private influxService: InfluxDBService = this.$services.influxService;
    // groups: EngineGroup[] = [];
    timeSelect: TimeSelection[];
    currentTimeSelection: TimeSelection = null;
    layoutSelect: string[]= ['Row', 'Column'];
    currentLayout: string = 'Row';
    openOptions: boolean = false;
    fetchInterval: any;
    openInfluxDialog: boolean = false;
    connectionSuccess: boolean = false;
    url: string = '';
    username: string = '';
    password: string = '';
    configText: string = '';
    queryText: string = '';
    beanCollisions: BeanConflict[] = [];
    clickAllowed: boolean = true;
    openTelegrafInput: boolean = false;
    openSampleQueries: boolean = false;
    statMap = null;
    chartName: string[] = [];
    states = new ChartStates(true, true, true, true, true, true);
    chartData: any[] = [];
    useInfluxDB: boolean = false;

    created() {
        this.timeSelect = this.statisticsService.intervals
            .map((interval) => new TimeSelection(this.createLabel(interval), interval));
        this.currentTimeSelection = this.timeSelect[3];
    }

    createLabel(interval: number) {
        if ((interval / 60) >= 1) {
            return ((interval / 60) + ' min');
        } else {
            return ((interval) + ' sec');
        }
    }

    mounted() {
        this.getInfluxConnection();
        // if (this.url !== null && this.url !== '') {
        //     this.useInfluxDB = true;
        //     this.testConnection();
        // }
        this.checkStatService();
        // this.getDataFromInflux();
        this.getData();
        this.checkCollecting();
    }

    beforeDestroy() {
        // this.statisticsService.stop();
        clearInterval(this.fetchInterval);
    }

    @Watch('useInfluxDB')
    checkStatService() {
        if (this.useInfluxDB === true) {
            this.callStatStop();
            // setting icon in Overview router-link in Sidebar
            // this.eventHub.$emit('toggleCollectingData', false);
        } else {
            this.callStatStart();         
            // setting icon in Overview router-link in Sidebar            
            // this.eventHub.$emit('toggleCollectingData', true);
        }
        this.getData();
     }

    //  @Watch('statisticsService.running')
     checkCollecting() {
         // setting icon in Overview router-link in Sidebar  
        this.eventHub.$emit('toggleCollectingData', this.statisticsService.isRunning());
     }

    getDataFromInflux() {
        // this.groups = this.$store.getters.groupsOfEngines;
        let names = [];
        this.$store.getters.groupsOfEngines.forEach( group => {
            names = names.concat(group.engines.map( engine => engine.engineId + '@' + this.getConnectionName(engine.id)));
        });
        // this.influx.testInfluxDB();

        this.influxService.getData(this.currentTimeSelection.time, names).then( result => {
            console.log('influx overview result', result);
        });
        // this.statisticsService.getData(this.currentTimeSelection.time, names).then( result => {
        //     console.log('satistics overview result', result);
        // });
    }

    get getRow() {
        if (this.currentLayout === 'Row') {
            return true;
        }
        else {
            return false;
        }
    }

    getInfluxConnection() {
        if (this.$store.state.user.influx.username !== null && this.$store.state.user.influx.username !== undefined && this.$store.state.user.influx.username !== '')  {
            this.username = this.$store.state.user.influx.username;
        } else {
            this.username = '';
        }
        if (this.$store.state.user.influx.password !== null && this.$store.state.user.influx.password !== undefined && this.$store.state.user.influx.password !== '') {
            this.password = this.$store.state.user.influx.password;
        } else {
            this.password = '';
        }
        if (this.$store.state.user.influx.url !== null && this.$store.state.user.influx.url !== undefined && this.$store.state.user.influx.url !== '') {
            this.url = this.$store.state.user.influx.url;
        } else {           
            this.url = '';
        }
    }

    storeInfluxConnection() {
        localStorage.setItem(this.$store.state.user.name + ':influxURL', this.url);
        localStorage.setItem(this.$store.state.user.name + ':influxUser', this.username);
        localStorage.setItem(this.$store.state.user.name + ':influxPass', this.password);
        this.$store.state.user.influx.url = this.url;
        this.$store.state.user.influx.username = this.username;
        this.$store.state.user.influx.password = this.password;
    }

    @Watch('states', { deep: true })
    getData() {
        let fetchingDataPromise: Promise<void | Map<String, StatesPrint[]>>;

        if (this.useInfluxDB) {
            console.log('using Influx DB');
            fetchingDataPromise = this.influxService.getData(this.currentTimeSelection.time, this.getNames());
        } else {
            console.log('using Local Storage DB');
            fetchingDataPromise = this.statisticsService.getData(this.currentTimeSelection.time, this.getNames());
        }

        fetchingDataPromise.then( (resultMap: Map<String, StatesPrint[]>) => {
            this.statMap = resultMap ? this.groupDataResult(resultMap) : [];
            this.chartName = [];
            this.chartData = [];
            if (this.statMap) {
                this.statMap.forEach((value, key) => {
                    this.chartName.push(key);
                    this.chartData.push(this.getChartData(this.states, value));
                });
            }
        });
    }

    groupDataResult(resultMap: Map<String, StatesPrint[]>) {
        let statMap = new Map<String, StatesPrint[]>();
        this.$store.getters.groupsOfEngines.forEach((group: EngineGroup) => {
            if (group.engines.length > 1) {
                let engines: StatesPrint[][] = group.engines.map( engine => resultMap.get(this.getEngineMapKey(engine)));

                if (engines && engines.length > 0) {
                    let gropStates: StatesPrint[] = engines[0].map(state => Object.assign({}, state));

                    for ( let j = 0; j < engines[0].length; j++ ) {
                        for (let i = 1; i < engines.length; i++) {
                            gropStates[j].running += engines[i][j].running; 
                            gropStates[j].dequeued += engines[i][j].dequeued;
                        }
                    }

                    statMap.set(group.name, gropStates);
                } else {
                    console.error(`No statistic for group ${group.name} with engines ${group.engines}`);
                }
            } else {
                let engineName = this.getEngineMapKey(group.engines[0]);
                statMap.set(engineName, resultMap.get(engineName));
            }
        });

        return statMap;
    }

    getEngineMapKey(engine: EngineStatus) {
        return engine.engineId + '@' + this.getConnectionName(engine.id);
    }

    groupMergeStates(to: StatesPrint, from: StatesPrint) {
        to.running += from.running; 
        to.dequeued += from.dequeued; 
    }

    getNames() {
        return this.$store.state.engineStatusList.map((engine) => engine.engineId + '@' + this.getConnectionName(engine.id));
    }

    getGroupNames() {
        let nameArray = this.$store.getters.groupsOfEngines.map((group) => {
            if (group.engines.length > 1) {
                return group.name;
            } else {
                return group.engines[0].engineId + '@' + this.getConnectionName(group.engines[0].id);
            }
        });
        return nameArray;
    }

    getConnectionName(id: number) {
        let connection = this.$store.getters.engineMBeans[id].connectionSettings;
        return connection.host + ':' + connection.port;
    }

    updateFetch(selection: TimeSelection) {
        this.currentTimeSelection =  selection;
        this.scheduleFetch();
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
        this.getInfluxConnection();
        this.openInfluxDialog = true;
    }

    callStatStart() {
        this.statisticsService.start();
        this.checkCollecting();
    }

    callStatStop() {
        this.statisticsService.stop();
        this.checkCollecting();
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
        this.storeInfluxConnection();
        this.eventHub.$emit('showNotification', new Notification('Connection settings saved'));
    }

    testConnection() {
        this.influxService.testConnection().then((response: any) => {
            if (this.parseInfluxResposne(response) === true) {
                this.connectionSuccess = true;
                this.storeInfluxConnection();
                this.eventHub.$emit('showNotification', new Notification('Connection Success'));
            } else {
                this.connectionSuccess = false;
                this.eventHub.$emit('showNotification', new Notification('Connection Failed', 'error'));
            }
        });
    }

    parseInfluxResposne(response) {
        let telegraf = false;
        if (response !== undefined && response !== null) {
            response[0].series[0].values.map((result) => {
                result.map((db) => {
                    if (db === 'telegraf') {
                        telegraf = true;
                    }
                });
            });
        }
        return telegraf;
    }

    triggerTelegrafInput() {
        if (this.clickAllowed === true) {
            this.clickAllowed = false;
            setTimeout(() => {
                this.clickAllowed = true;
            }, 750);
            if (this.openTelegrafInput === true) {
                this.scrollToTop(100);
            }
            this.openTelegrafInput = !this.openTelegrafInput;
        }
    }

    triggerSampleQueries() {
        if (this.clickAllowed === true) {
            this.clickAllowed = false;
            setTimeout(() => {
                this.clickAllowed = true;
            }, 750);
            if (this.openSampleQueries === true) {
                this.scrollToTop(150);
            }
            this.openSampleQueries = !this.openSampleQueries;
        }
    }

    // without this function, closing the Sample Queries section of the dialog
    // while scrolled down created strange behavior and styles. This function
    // smoothly scrolls up and resets the Scroll component when either Sample Queries
    // or Telegraf Input sections are closed to avoid this.
    scrollToTop(tick: number) {
        if (tick > 0) {
            setTimeout(() => {
                let elem = (this as any).$refs['perfectScroll'];
                elem.$el.scrollBy(0, -7);
                this.scrollToTop(tick - 1);
            }, 10);
        } else {
            (this as any).$refs.perfectScroll.update();
        }
    }

    scheduleFetch() {
        if (this.fetchInterval) {
            clearInterval(this.fetchInterval);
        }
        this.getData();
        this.fetchInterval = setInterval(() => {
            this.getData();
        }, this.currentTimeSelection.time * 1000);
    }

    getChartData(states: ChartStates, statesPrint: StatesPrint[]) {
        let dataset = [];
        if (statesPrint) {
            if (states.running) {
                dataset.push({
                    label: 'RUNNING',
                    backgroundColor: '#41ce00c4', // green
                    data: statesPrint.map((state) => state ? state.running : 0)
                });
            }
            if (states.waiting) {
                dataset.push({
                    label: 'WAITING',
                    backgroundColor: '#e4c200de', // yellow
                    data: statesPrint.map((state) => state ? state.waiting : 0)
                });
            }
            if (states.finished) {
                dataset.push({
                    label: 'FINISHED',
                    backgroundColor: '#1ad8b9c4',  // grey
                    data: statesPrint.map((state) => state ? state.finished : 0)
                });
            }
            if (states.dequeued) {
                dataset.push({
                    label: 'DEQUEUED',
                    backgroundColor: '#0b7babc4',  // blue
                    data: statesPrint.map((state) => state ? state.dequeued : 0)
                });
            }
            if (states.error) {
                dataset.push({
                    label: 'ERROR',
                    backgroundColor: '#de1515c4',  // red
                    data: statesPrint.map((state) => state ? state.error : 0)
                });
            }
            if (states.invalid) {
                dataset.push({
                    label: 'INVALID',
                    backgroundColor: '#770202c4',  // dark red
                    data: statesPrint.map((state) => state ? state.invalid : 0)
                });
            }
        }
        return {
            labels: statesPrint ? statesPrint.map((state) => state ? (Vue as any).moment(state.time).format('HH:mm:ss') : 'NA') : [],
            datasets: dataset
        };
  }
}
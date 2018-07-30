import { Component, Vue, Watch } from 'vue-property-decorator';
import { StatesPrint, ChartStates, EngineGroup, EngineStatus, EngineStatData, StatePromiseWrapper } from '../../../models/engine';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { Notification } from '../../../models/notification';
import { InfluxDBService } from '../../../services/influxDBService';
import { InfluxConnection, ChartSettings } from '../../../models/user';
import { StatisticsService } from '../../../services/statisticsService';
import { setTimeout } from 'timers';
import { Mutations } from '../../../store.vuex';
import { BeanConflict, BeanContext } from '../../../models/mbeans';
import { TimeSelection } from '../../../models/timeSelection';
import * as _ from 'lodash';
import './overview.scss';

const Stats = () => import('./stats').then(({ Stats }) => Stats);

@Component({
    template: require('./overview.html'),
    services: ['influxService', 'eventHub', 'statisticsService'],
    components: {
        'scroll': VuePerfectScrollbar,
        'stats': Stats
    }
})
export class OverviewComponent extends Vue {
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
        this.timeSelect = this.statisticsService.intervals.map((interval) => {
            return this.parseIntoTimeSelection(interval);
        });
        this.currentTimeSelection = this.timeSelect[3];
    }

    mounted() {
        this.getInfluxConnection();

        this.getChartSettings();
        this.checkStatService();
        this.scheduleFetch();
    }

    beforeDestroy() {
        clearInterval(this.fetchInterval);
    }

    @Watch('useInfluxDB')
    checkStatService() {
        localStorage.setItem(this.$store.state.user.name + ':useInfluxDB', String(this.useInfluxDB));
        this.$store.commit(Mutations.setUseInfluxDB, this.useInfluxDB);
        if (this.useInfluxDB) {
            this.statisticsService.stop();
            this.testConnection();
        } else {
            this.statisticsService.start();       
        }
        this.getData();
     }

    get getRow() {
        return (this.currentLayout === 'Row');
    }

    private getInfluxConnection() {
        let influxSettings = this.$store.state.user.influx;
        this.username = influxSettings.username ? influxSettings.username : '';
        this.password = influxSettings.password ? influxSettings.password : '';
        this.url = influxSettings.url ? influxSettings.url : '';
        this.useInfluxDB = influxSettings.useInfluxDB ? influxSettings.useInfluxDB : false;
    }

    private storeInfluxConnection() {
        localStorage.setItem(this.$store.state.user.name + ':influxURL', this.url);
        localStorage.setItem(this.$store.state.user.name + ':influxUser', this.username);
        localStorage.setItem(this.$store.state.user.name + ':influxPass', this.password);
        this.$store.commit(Mutations.setInfluxSettings, new InfluxConnection(this.url, this.username, this.password, null));        
    }

    private getChartSettings() {
        let chartSettings = this.$store.state.user.chart;
        this.currentTimeSelection = chartSettings.interval ? this.parseIntoTimeSelection(chartSettings.interval) : this.timeSelect[3];
        this.currentLayout = chartSettings.layout ? chartSettings.layout : 'Row';
    }

    private parseIntoTimeSelection(interval: number) {
        return new TimeSelection(this.createLabel(interval), interval);
    }

    private createLabel(interval: number) {
        if ((interval / 60) >= 1) {
            return ((interval / 60) + ' min');
        } else {
            return ((interval) + ' sec');
        }
    }

    @Watch('states', { deep: true })
    getData() {
            let fetchingDataPromise: StatePromiseWrapper;
    
            if (this.useInfluxDB) {
                fetchingDataPromise = this.influxService.getData(this.currentTimeSelection.time, this.getNames());
            } else {             
                fetchingDataPromise = this.statisticsService.getData(this.currentTimeSelection.time, this.getNames());
            }
    
            fetchingDataPromise.promise.then( (resultMap: Map<String, StatesPrint[]>) => {
                this.parseResultMap(resultMap, fetchingDataPromise.type);
            });
    }

    private parseResultMap(resultMap: Map<String, StatesPrint[]>, type: string) {
        if (this.desiredData(type) === true) {
            this.statMap = resultMap ? this.groupDataResult(resultMap) : [];
            this.chartName = [];
            this.chartData = [];
            if (this.statMap) {
                this.statMap.forEach((value, key) => {
                    this.chartName.push(key);
                    this.chartData.push(this.getChartData(this.states, value));
                });
            }
        }
    }

    private desiredData(type: string) {
        if (type === 'influx' && this.useInfluxDB === true) {
            return true;
        }
        if (type === 'statService' && this.useInfluxDB === false) {
            return true;
        }
        else {
            return false;
        }
    }

    private groupDataResult(resultMap: Map<String, StatesPrint[]>) {
        let statMap = new Map<String, StatesPrint[]>();
        this.$store.getters.groupsOfEngines.forEach((group: EngineGroup) => {
            if (group.engines.length > 1) {
                let engines: StatesPrint[][] = group.engines.map( engine => resultMap.get(this.getEngineMapKey(engine)) );

                if (engines && engines.length > 0) {
                    let gropStates: StatesPrint[] = engines[0].map(state => Object.assign({}, state));

                    for ( let j = 0; j < engines[0].length; j++ ) {
                        for (let i = 1; i < engines.length; i++) {
                            if (engines[i] && engines[i].length > j) {
                                gropStates[j].running += engines[i][j].running; 
                                gropStates[j].dequeued += engines[i][j].dequeued;
                            }
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

    private getEngineMapKey(engine: EngineStatus) {
        return engine.engineId + '@' + this.getConnectionName(engine.id);
    }

    private getNames() {
        return this.$store.state.engineStatusList.map((engine) => engine.engineId + '@' + this.getConnectionName(engine.id));
    }

    private getConnectionName(id: number) {
        let connection = this.$store.getters.engineMBean(id).connectionSettings;
        return connection.host + ':' + connection.port;
    }

    private updateFetch(selection: TimeSelection) {
        this.currentTimeSelection =  selection;
        localStorage.setItem(this.$store.state.user.name + ':chartInterval', String(selection.time));      
        this.$store.commit(Mutations.setChartInterval, selection.time);          
        this.scheduleFetch();
    }

    private updateLayout(layout: string) {
        this.currentLayout = layout;
        localStorage.setItem(this.$store.state.user.name + ':chartLayout', layout);      
        this.$store.commit(Mutations.setChartInterval, layout);      
    }

    private getName(group: EngineGroup) {
        if (group.engines.length > 1) {
            return group.name;
        } else {
            return group.engines[0].engineId;
        }
    }

    private triggerOpenInflux() {
        this.generateConfigFile();
        this.generateSampleQueries();
        this.getInfluxConnection();
        this.openInfluxDialog = true;
    }

    private generateConfigFile() {
        let beanNames = [];

        this.configText = '[[inputs.jolokia2_proxy]]\n#url goes from process.env.API_NAME variable like in jmxService. credentials is current user\n' +
            '     url = "' + this.parseURL() + '"\n' +
            '     username = "' + this.$store.state.user.name + '"\n' +
            '     password = "' + this.$store.state.user.password + '"\n\n' +
            '#From connections\n';

        this.$store.state.connectionResults.map((connection) => {
            this.configText += '[[inputs.jolokia2_proxy.target]]\n' +
                '     url = "service:jmx:rmi:///jndi/rmi://' + connection.settings.host + ':' + connection.settings.port + '/jmxrmi"\n' +
                '     username = "' + connection.settings.username + '"\n' +
                '     password = "' + connection.settings.password + '"\n';
        });

        this.configText += '\n#From engines. Name made from connection name and engine name to prevent collisions\n';
        this.$store.state.engineStatusList.map((engine: EngineStatus, index) => {
            let bean = engine.engineMXBean;
            let name = this.parseBeanName(bean.name);
            beanNames[index] = new BeanContext(bean.name, engine.engineId);
            this.configText += '[[inputs.jolokia2_proxy.metric]]\n' +
                '     name = "' + engine.engineId + '@' + bean.connectionSettings.host + ':' + bean.connectionSettings.port + '"\n' +
                '     mbean = "' + bean.name + '"\n' +
                '     paths = [ "InvalidCount", "ErrorCount", "WaitingCount", "RunningCount", "FinishedCount", "DequeuedCount" ]\n\n';
        });
        this.checkBeanNameConflict(beanNames);
    }

    private checkBeanNameConflict(beans) {
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

    private generateSampleQueries() {
        this.queryText = '#Sample Queries\n\n';
        this.$store.getters.groupsOfEngines.map((group) => {

            let engine = group.engines[0];
            let bean = engine.engineMXBean;

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

    private parseURL() {
        if (process.env.API_NAME.substr(0, 4) !== 'http') {
            let subUrl = window.location.href.substr(7);
            let endIndex = subUrl.indexOf('/');
            return window.location.href.substr(0, (endIndex + 7)) + process.env.API_NAME;
        } else {
            return process.env.API_NAME;
        }
    }

    private parseBeanName(fullName: string) {
        return fullName.substr(19);
    }

    private downloadConfig() {
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

    private copy(text) {
        let elem = window.document.createElement('textarea');
        elem.value = text;
        document.body.appendChild(elem);
        elem.select();
        document.execCommand('copy');
        document.body.removeChild(elem);
        this.eventHub.$emit('showNotification', new Notification('Copied to Clipboard'));
    }

    private submit() {
        this.storeInfluxConnection();
        this.eventHub.$emit('showNotification', new Notification('Connection settings saved'));
        if (this.useInfluxDB === true) {
            this.testConnection();
        }
    }

    private testConnection() {
        this.influxService.testConnection().then((response: any) => {
            if (this.parseInfluxResposne(response) === true) {
                this.connectionSuccess = true;
                this.storeInfluxConnection();
                this.eventHub.$emit('showNotification', new Notification('Connection Success'));
            } else {
                this.connectionSuccess = false;
                this.eventHub.$emit('showNotification', new Notification('Connection Failed', 'red'));
            }
        });
    }

    private parseInfluxResposne(response) {
        let telegraf = false;
        if (response) {
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

    private triggerTelegrafInput() {
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

    private triggerSampleQueries() {
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
    private scrollToTop(tick: number) {
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

    private scheduleFetch() {
        if (this.fetchInterval) {
            clearInterval(this.fetchInterval);
        }
        this.getData();
        this.fetchInterval = setInterval(() => {
            this.getData();
        }, this.currentTimeSelection.time * 1000);
    }

    private getConcreateState(dataElements, statesPrint, stateName) {
        return dataElements.concat(statesPrint.map((state) => state ? state[stateName] : 0));
    }

    private getChartData(states: ChartStates, statesPrint: StatesPrint[]) {
        let dataset = [];
        let emptySize = statesPrint ? 0 : this.statisticsService.pointNumbers;
        if (statesPrint && statesPrint.length < this.statisticsService.pointNumbers) { 
            emptySize = this.statisticsService.pointNumbers - statesPrint.length;
        }
        let dataElements = Array(emptySize).fill(undefined);

        if (statesPrint) {
            if (states.running) {
                dataset.push({
                    label: 'RUNNING',
                    backgroundColor: '#41ce00c4', // green
                    data: this.getConcreateState(dataElements, statesPrint, 'running')
                });
            }
            if (states.waiting) {
                dataset.push({
                    label: 'WAITING',
                    backgroundColor: '#e4c200de', // yellow
                    data: this.getConcreateState(dataElements, statesPrint, 'waiting')
                });
            }
            if (states.finished) {
                dataset.push({
                    label: 'FINISHED',
                    backgroundColor: '#1ad8b9c4',  // grey
                    data: this.getConcreateState(dataElements, statesPrint, 'finished')
                });
            }
            if (states.dequeued) {
                dataset.push({
                    label: 'DEQUEUED',
                    backgroundColor: '#0b7babc4',  // blue
                    data: this.getConcreateState(dataElements, statesPrint, 'dequeued')
                });
            }
            if (states.error) {
                dataset.push({
                    label: 'ERROR',
                    backgroundColor: '#de1515c4',  // red
                    data: this.getConcreateState(dataElements, statesPrint, 'error')
                });
            }
            if (states.invalid) {
                dataset.push({
                    label: 'INVALID',
                    backgroundColor: '#770202c4',  // dark red
                    data: this.getConcreateState(dataElements, statesPrint, 'invalid')
                });
            }
        }

        let lableElements = Array(emptySize).fill('');
        if (statesPrint) {
            lableElements = lableElements.concat( statesPrint.map((state) => state ? (Vue as any).moment(state.time).format('HH:mm:ss') : ''));
        }

        return {
            labels: lableElements,
            datasets: dataset
        };
  }
}
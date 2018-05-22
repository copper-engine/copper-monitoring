import { StatesPrint, ChartStates, EngineGroup, EngineStatus } from '../models/engine';
import { Store } from 'vuex';
import Vue from 'vue';
import { StoreState } from '../store.vuex';
import { JmxService } from './jmxService';
import { MBean } from '../models/mbeans';
import * as moment from 'moment';

// Statistic Service will collect in backgorund data about engine statuses
export class StatisticsService {
    aggData: StatesPrint[][][] = []; 
    pointNumbers = 30;
    public intervals = [5, 15, 30, 60, 300, 900]; // 5s, 15s, 30s, 1m, 5m, 15m
    private aggLength = [];
    private aggCounters = [];
    fetchDataInterval = null;
    private running = true;
    private lsKey;
    private lsAggKey;

    constructor(private store: Store<StoreState>, private jmxService: JmxService) {
        this.aggLength = [0];
        for (let i = 1; i < this.intervals.length; i++) {
            this.aggLength.push(Math.floor(this.intervals[i] / this.intervals[i - 1]));
        }
    }

    init() {
        try {
            this.lsKey = this.store.state.user.name + ':statitics';
            this.lsAggKey = this.store.state.user.name + ':statitics:aggCounters';

            // SIMULATE GUP here
            this.aggData = JSON.parse(localStorage.getItem(this.lsKey));
            if (!this.aggData || this.aggData.length !== this.intervals.length) {
                this.aggData = this.intervals.map(int => []);   
            }

            this.aggCounters = JSON.parse(localStorage.getItem(this.lsAggKey));    
            if (!this.aggCounters) {
                this.aggCounters = this.aggLength.map(x => x);
            }
        } catch (err) {
            console.error('Failed to load statistics for key: ' + this.lsKey + '. Will init empty statistics. Error:' , err);
            this.aggData = this.intervals.map(int => []);   
            this.aggCounters = this.aggLength.map(x => x);
        }

        this.scheduleInterval();
    }

    // Interval is allways running. Even when collecting of statistics is stoped(in that case it's stores empty state prints)
    private scheduleInterval() {
        this.fetchDataInterval = setInterval(() => {
            if (this.running && this.store.getters.groupsOfEngines && this.store.getters.groupsOfEngines.length > 0) {
                this.fetchingData().then(result => {
                    this.addAggData(result, 0);
                });                
            } else {
                this.addAggData([ new StatesPrint() ], 0);
            }
        }, this.intervals[0] * 1000);
    }

    destroy() {
        clearInterval(this.fetchDataInterval);
    }

    start() {
        this.running = true;
    }
    
    stop() {
        this.running = false;
    }

    isRunning() {
        return this.running;
    }

    reset() {
        this.aggData = [];
        this.aggCounters = this.aggLength.map(x => x);
    }

    getData(interval: number, engineNames: String[]): Map<String, StatesPrint[]> {
        console.log('Getting data for interval ', interval, engineNames);

        let index = this.intervals.indexOf(interval);
        if (index === -1) {
            console.error(`Illegal interval:  ${interval}. Interval expected to be one of thouse: ${this.intervals}`);
            return null;
        }

        let data: StatesPrint[][] = this.aggData[index].slice(0, this.pointNumbers);

        if (engineNames && engineNames.length > 0) {
            data = data.map(element => element.filter(states =>  engineNames.indexOf(states.engine) !== -1));
        }

        let resultsPerEngine: Map<String, StatesPrint[]> = new Map<String, StatesPrint[]>();
        let dateNow = moment().subtract(interval, 'seconds').toDate();

        engineNames.forEach(engineName => {
            let engineResult = data.map( enginesTick => enginesTick.find(state => state.engine === engineName) );

            // TODO make coment here about what is that
            for (let i = 0; i < engineResult.length; i++) {
                if (!engineResult[i]) {
                    console.log('No data will put empty State Print');
                    if (data[i][0]) {
                        engineResult[i] = new StatesPrint(data[i][0].time);
                    } else {
                        engineResult[i] = new StatesPrint(dateNow);
                    }
                    engineResult[i].engine = <string> engineName;
                }
            }

            resultsPerEngine.set(engineName, engineResult);
        });

        console.log('Getting data result ', resultsPerEngine);

        return resultsPerEngine;
    }
    

    // Recursively fintion that will add and aggregate new incoming data.
    // called from outside with aggIndex = 0 
    // will add new data to apropriate array, by indexof fetch interval. 
    // If there ara enough new data in array to aggregate them to next array, 
    // then will do aggregation and add max of aggregatable data to next array 
    addAggData(el, aggIndex) {
        this.aggData[aggIndex].push(el);
        if (this.aggData[aggIndex].length > this.pointNumbers) {
            this.aggData[aggIndex].shift();
        }

        if (aggIndex < this.intervals.length - 1) {
            this.aggCounters[aggIndex + 1] = this.aggCounters[aggIndex + 1] - 1;
            if (this.aggCounters[aggIndex + 1] <= 0) {
                this.aggCounters[aggIndex + 1] = this.aggLength[aggIndex + 1];
                let toAgg = this.aggData[aggIndex].slice(-this.aggLength[aggIndex + 1]);
                this.addAggData(this.max(toAgg), aggIndex + 1);
            } else {
                this.saveToLocalStorage();
            }
        } else {
            this.saveToLocalStorage();
        }
    }

    printAggData() {
        console.log('Statistics Data: ', this.aggData);
        console.log('Statistics agg counters: ', this.aggCounters);
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem(this.lsKey, JSON.stringify(this.aggData));
        } catch (err) {
            console.error('Failed to store agg data with lengths', this.aggData.map(arr => arr.length));
        }

        localStorage.setItem(this.lsAggKey, JSON.stringify(this.aggCounters));
    }
        
    max(enginesStates: StatesPrint[][]): StatesPrint[] {
        let maxEngineStates: StatesPrint[] = enginesStates[0];

        for (let i = 1; i < enginesStates.length; i++) {
            enginesStates[i].forEach(states => {
                let currentMaxStates = this.findEngineStates(maxEngineStates, states.engine);

                if (!currentMaxStates) {
                    console.error('currentMaxStates is undefined for: states.engine', states.engine, maxEngineStates);                    
                } else {
                    // in case currentMaxStates.dequeued === undefined
                    if (currentMaxStates.dequeued < states.dequeued || !currentMaxStates.dequeued ) {
                        currentMaxStates.dequeued = states.dequeued;
                    }
                    if (currentMaxStates.error < states.error || !currentMaxStates.error ) {
                        currentMaxStates.error = states.error;
                    }
                    if (currentMaxStates.finished < states.finished || !currentMaxStates.finished ) {
                        currentMaxStates.finished = states.finished;
                    }
                    if (currentMaxStates.invalid < states.invalid || !currentMaxStates.invalid ) {
                        currentMaxStates.invalid = states.invalid;
                    }
                    if (currentMaxStates.running < states.running || !currentMaxStates.running ) {
                        currentMaxStates.running = states.running;
                    }
                    if (currentMaxStates.waiting < states.waiting || !currentMaxStates.waiting ) {
                        currentMaxStates.waiting = states.waiting;
                    }
                }
            });
        }

        return maxEngineStates;
    }

    findEngineStates(enginesStates: StatesPrint[], engineId: string) {
        return enginesStates.find(state => state.engine === engineId);
    }

    async fetchingData() {
        let result: StatesPrint[] = [];
        let groupsOfEngines: EngineGroup[] = this.store.getters.groupsOfEngines;
        let promises: Promise<void>[] = [];

        // can be improved by calling 1 jolokia request
        if (groupsOfEngines) {
            groupsOfEngines.forEach(group => {
                if (group.name && group.engines.length > 1) {
                    let mbeans = group.engines.map((engine) => this.store.getters.engineMBeans[engine.id]); 
                    promises.push(this.jmxService.getGroupChartCounts(mbeans, group.engines.length, this.store.state.user).then((newStates: StatesPrint) => {
                        // this.addNewState(group.name, newStates);
                        newStates.engine = group.name;
                        result.push(newStates);
                    }));
                } else {
                    // engines without groups grouped to group with undefined name
                    group.engines.forEach( (engine: EngineStatus) => {
                        let mbean: MBean = this.store.getters.engineMBeans[engine.id];
                        promises.push(this.jmxService.getChartCounts(this.store.getters.engineMBeans[engine.id], this.store.state.user).then((newStates: StatesPrint) => {   
                            // can be improved by getting connection settings & engine ID
                            // this.addNewState('' + engine.id, newStates);
                            newStates.engine = engine.engineId + '@' + mbean.connectionSettings.toString();
                            result.push(newStates);
                        }));
                    });
                }
            });
        }

        await Promise.all(promises);
        return result;
    }
}
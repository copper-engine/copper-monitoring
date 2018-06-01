import { StatesPrint, ChartStates, EngineGroup, EngineStatus } from '../models/engine';
import { Store } from 'vuex';
import Vue from 'vue';
import { StoreState } from '../store.vuex';
import { JmxService } from './jmxService';
import { MBean } from '../models/mbeans';
import * as moment from 'moment';

const MINUTE = 60 * 1000;
class StatisticsLock {
    constructor(public id: number, public timestamp: Date) {}
}

// Statistic Service will collect in backgorund data about engine statuses
export class StatisticsService {
    private id = Math.floor(Math.random() * 100000000000000000);
    aggData: StatesPrint[][][] = []; 
    pointNumbers = 30;
    public intervals = [ 5, 15, 30, 60, 300, 900 ]; // 5s, 15s, 30s, 1m, 5m, 15m
    private aggLength = [];
    private aggCounters = [];
    private fetchDataInterval = null;
    public running = true;
    private lsKey;
    private lsAggKey;
    private lsLockKey;
    private obtainLockInterval = null;
    public holdingLock = false;
    private lock: StatisticsLock = null;

    constructor(private store: Store<StoreState>, private jmxService: JmxService) {
        this.aggLength = [0];
        for (let i = 1; i < this.intervals.length; i++) {
            this.aggLength.push(Math.floor(this.intervals[i] / this.intervals[i - 1]));
        }
    }

    init() {  
        this.createLSKeys();
        this.obtainLock();
        this.loadDataFromLS();
        this.scheduleInterval();
    }

    printAggData() {
        console.log('Statistics Data: ', this.aggData);
        console.log('Statistics agg counters: ', this.aggCounters);
    }
    
    destroy() {
        clearInterval(this.fetchDataInterval);
        this.releaveLock();
        window.onbeforeunload = () => {}; 
    }

    start() {
        this.running = true;
    }
    
    stop() {
        this.releaveLock();
        this.running = false;
    }
    
    getData(interval: number, engineNames: String[]): Promise<void | Map<String, StatesPrint[]>> {
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
                    engineResult[i] = new StatesPrint(data[i][0] ? data[i][0].time : dateNow);
                    engineResult[i].engine = <string> engineName;
                }
            }

            resultsPerEngine.set(engineName, engineResult);
        });

        return Promise.resolve(resultsPerEngine);
    }

    private createLSKeys() {
        this.lsLockKey = this.store.state.user.name + ':statitics:lock';
        this.lsKey = this.store.state.user.name + ':statitics';
        this.lsAggKey = this.store.state.user.name + ':statitics:aggCounters';
    }

    private loadDataFromLS() {
        try {            
            this.aggData = JSON.parse(localStorage.getItem(this.lsKey));
            if (!this.aggData || this.aggData.length !== this.intervals.length) {
                this.aggData = this.intervals.map(int => []);   
            }
            
            this.aggCounters = JSON.parse(localStorage.getItem(this.lsAggKey));    
            if (!this.aggCounters) {
                this.aggCounters = this.aggLength.map(x => x);
            }
            this.fillGaps();
        } catch (err) {
            console.error('Failed to load statistics for key: ' + this.lsKey + '. Will init empty statistics. Error:' , err);
            this.aggData = this.intervals.map(int => []);   
            this.aggCounters = this.aggLength.map(x => x);
        }
    }

    private fillGaps() {
        let ticks = this.getDiff();

        if (ticks > 1) {
            if ( ticks < 30) {
                for (let i = 0; i < ticks; i++) {
                    this.addAggData([ new StatesPrint(null) ], 0);
                }
            } else {
                this.aggData = this.intervals.map(int => []); 
            }
        }
    }

    private getDiff() {
        let prev = localStorage.getItem('prevTS');
        if (prev) {
            let current = new Date().getTime();
            return Math.floor((current - parseInt(prev)) / (this.intervals[0] * 1000));
        } else {
            return null;
        }
    }
    
    // Interval is allways running. Even when collecting of statistics is stoped(in that case it's stores empty state prints)
    private scheduleInterval() {
        this.fetchDataInterval = setInterval(() => {
            if (this.running && this.store.getters.groupsOfEngines && this.store.getters.groupsOfEngines.length > 0) {
                this.fetchingData().then(result => {
                    localStorage.setItem('prevTS', String(result[0].time.getTime()));
                    this.addAggData(result, 0);
                });                
            } else {
                this.addAggData([ new StatesPrint() ], 0);
            }
        }, this.intervals[0] * 1000);
    }

    private async fetchingData() {
        let result: StatesPrint[] = [];
        let engines: EngineStatus[] = this.store.state.engineStatusList;
        let promises: Promise<void>[] = [];

        // can be improved by calling 1 jolokia request
        if (engines) {
            engines.forEach( (engine: EngineStatus) => {
                let mbean: MBean = this.store.getters.engineMBeans[engine.id];
                promises.push(this.jmxService.getChartCounts(this.store.getters.engineMBeans[engine.id], this.store.state.user).then((newStates: StatesPrint) => {   
                    // can be improved by getting connection settings & engine ID
                    // this.addNewState('' + engine.id, newStates);
                    newStates.engine = engine.engineId + '@' + mbean.connectionSettings.toString();
                    result.push(newStates);
                }));
            });
        }

        await Promise.all(promises);
        return result;
    }

    // Recursively fintion that will add and aggregate new incoming data.
    // called from outside with aggIndex = 0 
    // will add new data to apropriate array, by indexof fetch interval. 
    // If there ara enough new data in array to aggregate them to next array, 
    // then will do aggregation and add max of aggregatable data to next array 
    private addAggData(el, aggIndex) {
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

    private saveToLocalStorage() {
        if (this.running && ((this.holdingLock && this.isLockOwner()) || this.obtainLock())) {
            try {
                this.updateLock(); 
                localStorage.setItem(this.lsKey, JSON.stringify(this.aggData));
            } catch (err) {
                console.error('Failed to store agg data with lengths', this.aggData.map(arr => arr.length));
            }
    
            localStorage.setItem(this.lsAggKey, JSON.stringify(this.aggCounters));
        }
    }
        
    private max(enginesStates: StatesPrint[][]): StatesPrint[] {
        let timestamp: Date = enginesStates[0][0] ? enginesStates[0][0].time : null;
        let maxEngineStates: StatesPrint[] = enginesStates[0].filter( engineState => engineState.engine);

        for (let i = 1; i < enginesStates.length; i++) {
            enginesStates[i].filter( engineState => engineState.engine)
            .forEach(states => {
                let currentMaxStates = maxEngineStates.find(state => state.engine === states.engine);

                if (!currentMaxStates) {
                    let newMaxState = Object.assign(new StatesPrint(), states);
                    if (timestamp) {
                        newMaxState.time = timestamp;
                    } else if (maxEngineStates[0]) {
                        newMaxState.time = maxEngineStates[0].time;
                    }

                    maxEngineStates.push(newMaxState);
                } else {
                    // in case currentMaxStates.dequeued === undefined
                    if ( currentMaxStates.dequeued < states.dequeued || !currentMaxStates.dequeued ) {
                        currentMaxStates.dequeued = states.dequeued;
                    }
                    if ( currentMaxStates.error < states.error || !currentMaxStates.error ) {
                        currentMaxStates.error = states.error;
                    }
                    if ( currentMaxStates.finished < states.finished || !currentMaxStates.finished ) {
                        currentMaxStates.finished = states.finished;
                    }
                    if ( currentMaxStates.invalid < states.invalid || !currentMaxStates.invalid ) {
                        currentMaxStates.invalid = states.invalid;
                    }
                    if ( currentMaxStates.running < states.running || !currentMaxStates.running ) {
                        currentMaxStates.running = states.running;
                    }
                    if ( currentMaxStates.waiting < states.waiting || !currentMaxStates.waiting ) {
                        currentMaxStates.waiting = states.waiting;
                    }
                }
            });
        }

        return maxEngineStates;
    }

    private isLockOwner() {
        try {
            this.lock = JSON.parse(localStorage.getItem(this.lsLockKey));
        } catch (err) {
            return false;
        }
        return this.lock && this.lock.id === this.id;
    }

    private obtainLock() {
        this.lock = null;
        try {
            this.lock = JSON.parse(localStorage.getItem(this.lsLockKey));
        } catch (err) {
            console.error('Failed to load this.lock for key: ' + this.lsLockKey + '. Will init empty statistics. Error:' , err);
        }
        
        if (!this.lock || ((new Date().getTime() - new Date(this.lock.timestamp).getTime()) > MINUTE)) {
            this.updateLock();  
          
            window.onbeforeunload = () => {
                clearInterval(this.fetchDataInterval);
                localStorage.removeItem(this.lsLockKey);
            };    

            this.holdingLock = true;
        } else {
            this.holdingLock = false;
        }
        
        return this.holdingLock;
    }

    private updateLock() {
        this.lock = new StatisticsLock(this.id, new Date());
        localStorage.setItem(this.lsLockKey, JSON.stringify(this.lock)); 
    }

    private releaveLock() {
        this.holdingLock = false;
        localStorage.removeItem(this.lsLockKey);
        window.onbeforeunload = () => {}; 
    }
}
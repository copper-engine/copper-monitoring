import { StatesPrint, ChartStates, EngineGroup, EngineStatus } from '../models/engine';
import { Store } from 'vuex';
import Vue from 'vue';
import { StoreState } from '../store.vuex';
import { JmxService } from './jmxService';
import { MBean } from '../models/mbeans';

// const STATISTICS_KEY = 'statitics';
export class StatisticsService {
    // data: Map<String, StatesPrint[]> = new Map<String, StatesPrint[]>(); 
    // data: Array<Array<StatesPrint>> = [];
    // data: StatesPrint[][] = [];
    // dataArr: StatesPrint[][] = [];
    aggData: StatesPrint[][][] = []; 
    pointNumbers = 30;
    // maxSize; 
    public intervals = [5, 15, 30, 60, 300, 900]; // 5s, 15s, 30s, 1m, 5m, 15m
    aggLength = [];
    fetchDataInterval = null;
    private running = true;
    private lsKey;

    constructor(private store: Store<StoreState>, private jmxService: JmxService) {
        // this.maxSize = this.pointNumbers * this.intervals[0];
        this.aggLength = [0];

        for (let i = 1; i < this.intervals.length; i++) {
            this.aggLength.push(Math.floor(this.intervals[i] / this.intervals[i - 1]));
        }
        // console.log('agg length: ', this.aggLength);
        // this.aggLength = this.intervals.map(interval => Math.floor(interval / this.intervals[0]));
        // this.maxSize = Math.floor(this.intervals[this.intervals.length] / this.intervals[0] * this.pointNumbers);
    }

    saveToLocalStorage() {
        // console.log('saving data by key', this.lsKey);
        localStorage.setItem(this.lsKey, JSON.stringify(this.aggData));
    }
    
    init() {
        // localStorage.setItem(this.secondsKey, JSON.stringify(this.secondsStates));

        try {
            this.lsKey = this.store.state.user.name + ':statitics';
            this.aggData = JSON.parse(localStorage.getItem(this.lsKey));            
            // console.log('data loaded by key', this.lsKey, this.aggData);
            if (!this.aggData || this.aggData.length !== this.intervals.length) {
                this.aggData = this.intervals.map(int => []);   
            }

            // console.log('data loaded');
        } catch (err) {
            console.log('error:', err);
            console.error('Failed to load statistics for key: ' + this.lsKey + '. Will init empty statistics');
            this.aggData = this.intervals.map(int => []);   
        }

        // console.log('start fetching');
        this.fetchDataInterval = setInterval(() => {
            if (this.running) {
                this.fetchingData().then(result => {
                    // this.data.push(result);
                    this.addAggData(result, 0);
                    // console.log('aggdata', this.aggData);
                });                
            } else {
                this.addAggData([], 0);
                // console.log('feeling empty time');
                // console.log('aggdata', this.aggData);
            }
        }, this.intervals[0] * 1000);
    }


    destroy() {
        clearInterval(this.fetchDataInterval);
    }

    start() {
        console.log('start collecting statistics');
        this.running = true;
    }
    
    stop() {
        this.running = false;
        console.log('stoping collecting statistics');
        // clearInterval(this.fetchDataInterval);
    }

    isRunning() {
        return this.running;
    }

    reset() {
        // this.data = new Map<String, StatesPrint[]>(); 
        this.aggData = [];
    }

    getData(interval: number, engineNames: String): StatesPrint[][] {
        let index = this.intervals.indexOf(interval);
        if (index === -1) {
            console.error(`Illegal interval:  ${interval}. Interval expected to be one of thouse: ${this.intervals}`);
            return null;
        }
        let result: StatesPrint[][] = this.addAggData[index].slice(0, this.pointNumbers);

        if (engineNames && engineNames.length > 0) {
            result = result.map(element => element.filter(states =>  engineNames.indexOf(states.engine) !== -1));
        }

        return result;
    }
    
    // getData(interval: number) {
        // let index = this.intervals.lastIndexOf(interval);
        // if (index === -1) {
        //     console.error(`Illegal interval:  ${interval}. Interval expected to be one of thouse: ${this.intervals}`);
        //     return;
        // }

        // let chunkSize = this.intervals[index] / this.intervals[0];
        
        // let groupsOfEngines: EngineGroup[] = this.store.getters.groupsOfEngines;
        // groupsOfEngines.forEach(group => {
        //     if (group.name && group.engines.length > 1) {
        //         // get data by name then chunk it and get max vals
        //         group.name


        //     } else {
        //         group.engines.forEach( (engine: EngineStatus) => {
        //             '' + engine.id
        //         });
        //     }
        // });
    // }

    // addData(el) {
    //     this.data.push(el);
    //     if (this.data.length > this.maxSize + this.aggLength[1]) {
    //         this.addAggData(this.max(this.data.slice(0, this.aggLength[1])), 1);
    //     }
    // }

    addAggData(el, aggIndex) {
        console.log(`add el ${el} by agg index: ${aggIndex}`);
        this.aggData[aggIndex].push(el);
        if (aggIndex < this.intervals.length - 1) {
            if (this.aggData[aggIndex].length >= this.pointNumbers + this.aggLength[aggIndex + 1]) {
                console.log('will agregate data to index:', aggIndex + 1, 'agg legth', this.aggLength[aggIndex + 1]);
                console.log('before this.aggData[aggIndex].length', this.aggData[aggIndex].length);
                let toAgg = this.aggData[aggIndex].slice(0, this.aggLength[aggIndex + 1]);
                this.aggData[aggIndex] = this.aggData[aggIndex].slice(this.aggLength[aggIndex + 1]);
                console.log('after this.aggData[aggIndex].length', this.aggData[aggIndex].length);
                this.addAggData(this.max(toAgg), aggIndex + 1);
            }
        } else if (this.aggData[aggIndex].length > this.pointNumbers) {
            this.aggData[aggIndex].shift();
        }
        this.saveToLocalStorage();
    }
        
    max(enginesStates: StatesPrint[][]): StatesPrint[] {
        console.log('counting max of', enginesStates);
        let maxEngineStates: StatesPrint[] = enginesStates[0];

        for (let i = 1; i < enginesStates.length; i++) {
            enginesStates[i].forEach(states => {
                let currentMaxStates = this.findEngineStates(maxEngineStates, states.engine);
                if (currentMaxStates.dequeued < states.dequeued ) {
                    currentMaxStates.dequeued = states.dequeued;
                }
                if (currentMaxStates.error < states.error ) {
                    currentMaxStates.error = states.error;
                }
                if (currentMaxStates.finished < states.finished ) {
                    currentMaxStates.finished = states.finished;
                }
                if (currentMaxStates.invalid < states.invalid ) {
                    currentMaxStates.invalid = states.invalid;
                }
                if (currentMaxStates.running < states.running ) {
                    currentMaxStates.running = states.running;
                }
                if (currentMaxStates.waiting < states.waiting ) {
                    currentMaxStates.waiting = states.waiting;
                }
            });
        }

        console.log('max is', maxEngineStates);

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

    // addNewState(key: string, newStates: StatesPrint) {
    //     if (!this.data.get(key)) {
    //         this.data.set(key, []);
    //     }
    //     this.data.get(key).push(newStates);
    //     if (this.data.get(key).length > this.maxSize) {
    //         this.data.get(key).shift();
    //     }
    // }

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
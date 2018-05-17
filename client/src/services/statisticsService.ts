import { StatesPrint, ChartStates, EngineGroup, EngineStatus } from '../models/engine';
import { Store } from 'vuex';
import Vue from 'vue';
import { StoreState } from '../store.vuex';
import { JmxService } from './jmxService';
import { MBean } from '../models/mbeans';

export class StatisticsService {
    // data: Map<String, StatesPrint[]> = new Map<String, StatesPrint[]>(); 
    // data: Array<Array<StatesPrint>> = [];
    data: StatesPrint[][] = [];
    dataArr: StatesPrint[][] = [];
    aggData: StatesPrint[][][] = []; 
    pointNumbers = 30;
    maxSize; 
    public intervals = [5, 15, 30, 60, 300, 900]; // 5s, 15s, 30s, 1m, 5m, 15m
    aggLength = [];
    fetchDataInterval = null;
    private running = true;

    constructor(private store: Store<StoreState>, private jmxService: JmxService) {
        this.maxSize = this.pointNumbers * this.intervals[0];
        this.aggLength = [0];

        for (let i = 1; i < this.intervals.length; i++) {
            this.aggLength.push(Math.floor(this.intervals[i] / this.intervals[i - 1]));
        }
        // this.aggLength = this.intervals.map(interval => Math.floor(interval / this.intervals[0]));
        // this.maxSize = Math.floor(this.intervals[this.intervals.length] / this.intervals[0] * this.pointNumbers);

        this.init();
    }
    
    init() {
        this.fetchDataInterval = setInterval(() => {
            if (this.running) {
                this.fetchingData().then(result => {
                    // this.data.push(result);
                    this.addData(result);
                    console.log('data', this.data);
                    console.log('aggdata', this.aggData);
                });                
            } else {
                this.addData([]);
                console.log('feeling empty time');
                console.log('aggdata', this.aggData);
            }
        }, this.intervals[0] * 1000);
    }


    destroy() {
        clearInterval(this.fetchDataInterval);
    }

    addData(el) {
        this.data.push(el);
        if (this.data.length > this.maxSize + this.aggLength[1]) {
            this.addAggData(this.max(this.data.slice(0, this.aggLength[1])), 1);
        }
    }

    addAggData(el, aggIndex) {
        this.aggData[aggIndex].push(el);
        if (aggIndex < this.intervals.length) {
            if (this.aggData[aggIndex].length > this.maxSize + this.aggLength[aggIndex + 1]) {
                this.addAggData(this.max(this.data.slice(0, this.aggLength[aggIndex + 1])), aggIndex + 1);
            }
        } else if (this.aggData[aggIndex].length > this.maxSize) {
            this.aggData[aggIndex].shift();
        }
    }

    max(enginesStates: StatesPrint[][]) {
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

        return maxEngineStates;
    }

    findEngineStates(enginesStates: StatesPrint[], engineId: string) {
        return enginesStates.find(state => state.engine === engineId);
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
        this.data = [];
    }

    getData(interval: number) {
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
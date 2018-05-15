import { StatesPrint, ChartStates, EngineGroup, EngineStatus } from '../models/engine';
import { Store } from 'vuex';
import Vue from 'vue';
import { StoreState } from '../store.vuex';
import { JmxService } from './jmxService';

export class StatisticsService {
    data: Map<String, StatesPrint[]> = new Map<String, StatesPrint[]>(); 
    pointNumbers = 12;
    maxSize; 
    public intervals = [5, 15, 30, 60, 300, 900]; // 5s, 15s, 30s, 1m, 5m, 15m
    // storageLength = [];
    fetchDataInterval = null;
    running = false;

    constructor(private store: Store<StoreState>, private jmxService: JmxService) {
        // this.storageLength = this.intervals.map(interval => interval * this.pointNumbers);
        
        this.maxSize = Math.floor(this.intervals[this.intervals.length] / this.intervals[0] * this.pointNumbers);
    }
    
    start() {
        this.running = true;
        console.log('starting collecting statistics');
        if (this.fetchDataInterval) {
            clearInterval(this.fetchDataInterval);
        }
        this.fetchingData();
        this.fetchDataInterval = setInterval(() => {
            this.fetchingData();
            
            console.log('data', this.data);
        }, this.intervals[0] * 1000);
    }
    
    stop() {
        this.running = false;
        console.log('stoping collecting statistics');
        clearInterval(this.fetchDataInterval);
    }

    reset() {
        this.data = new Map<String, StatesPrint[]>(); 
    }

    getData(from: Date, interval: number) {

    }

    fetchingData() {
            let groupsOfEngines: EngineGroup[] = this.store.getters.groupsOfEngines;

            // can be improved by calling 1 jolokia request
            groupsOfEngines.forEach(group => {
                if (group.name) {
                    let mbeans = group.engines.map((engine) => this.store.getters.engineMBeans[engine.id]); 
                    this.jmxService.getGroupChartCounts(mbeans, group.engines.length, this.store.state.user).then((newStates: StatesPrint) => {
                        this.addNewState(group.name, newStates);
                    });
                } else {
                    group.engines.forEach( (engine: EngineStatus) => {
                        this.jmxService.getChartCounts(this.store.getters.engineMBeans[engine.id], this.store.state.user).then((newStates: StatesPrint) => {   
                            // can be improved by getting connection settings & engine ID
                            this.addNewState('' + engine.id, newStates);
                        });
                    });
                }
            });
    }

    addNewState(key: string, newStates: StatesPrint) {
        if (!this.data.get(key)) {
            this.data.set(key, []);
        }
        this.data.get(key).push(newStates);
        if (this.data.get(key).length > this.maxSize) {
            this.data.get(key).shift();
        }
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
import Axios from 'axios';
import moment from 'moment';
import { StatesPrint, StatePromiseWrapper } from '../models/engine';
import { Store } from 'vuex';
import { StoreState } from '../store.vuex';
import { User } from '../models/user';

export class InfluxDBService {
    private user: User;

    constructor(private store: Store<StoreState>) {}


    // interval is in seconds
    getData(interval: number, engineNames: string[]): StatePromiseWrapper { 

        let timeUntil = moment().subtract(interval * 30, 'seconds').unix() * 1000000000;

        let allRequests = engineNames.map( engineName => {
            let query =  `q=SELECT
                MAX("RunningCount") AS "MAX_RunningCount",
                MAX("WaitingCount") AS "MAX_WaitingCount",
                MAX("FinishedCount") AS "MAX_FinishedCount",
                MAX("DequeuedCount") AS "MAX_DequeuedCount",
                MAX("ErrorCount") AS "MAX_ErrorCount",
                MAX("InvalidCount") AS "MAX_InvalidCount"
                FROM "telegraf"."autogen"."${engineName}"
                WHERE time > ${timeUntil} GROUP BY time(${interval}s) FILL(previous)`;

            return Axios.get(this.requestBase() + query);
        });

        let promise = Promise.all(allRequests).then( responsesArr => {
            let dataMap: Map<String, StatesPrint[]> = new Map<String, StatesPrint[]>();

            responsesArr.forEach( (response, index) => {
                if (response.data.results[0].series) {
                    let states: StatesPrint[] = response.data.results[0].series[0].values.map(
                        result => new StatesPrint(new Date(result[0]), result[1], result[2], result[3], result[4], result[5], result[6], engineNames[index]));
                        dataMap.set(engineNames[index], states);
                }
            });

            return dataMap;
        })
        .catch(error => {
            console.error('Can\'t connect to InfluxDB. Checkout if it\'s running. Error fetching Engine Status:', error);
        });

        return new StatePromiseWrapper(promise, 'influx');
       
    }

    public testInfluxDB() {

        console.log('will try to connect to Influx DB');
        // http://localhost:8086/query?q=select+*+from+telegraf..cpu
        // http://localhost:8086/query?q=show+databases


        console.log(moment());
        console.log(moment().subtract(1, 'hours').toDate().getTime());
        console.log(moment().subtract(1, 'hours').unix() * 1000000000);
        let hourAgo = moment().subtract(1, 'hours').unix() * 1000000000;

        let query = `SELECT 
            max("RunningCount") AS "RunningCount", 
            max("WaitingCount") AS "WaitingCount", 
            max("FinishedCount") AS "FinishedCount", 
            max("DequeuedCount") AS "DequeuedCount", 
            max("ErrorCount") AS "ErrorCount", 
            max("InvalidCount") AS "InvalidCount"
            FROM "telegraf"."autogen"."localhost_1098_persistent.engine" WHERE time > ${hourAgo} GROUP BY time(10m) FILL(null)`;


        Axios.get('http://localhost:8086/query?u=copper&p=copper&q=' + query)
            .then((response) => {
                console.log('response.data.results[0].series[0].values', response.data.results[0].series[0].values);
                let states: StatesPrint[] = response.data.results[0].series[0].values.map(
                    result => new StatesPrint(new Date(result[0]), result[1], result[2], result[3], result[4], result[5], result[6]));

                    console.log('states', states);
                return states;
            })
            .catch(error => {
                console.error('Can\'t connect to InfluxDB. Checkout if it\'s running. Error fetching Engine Status:', error);
            });
    }

    private requestBase() {
        let url = this.store.state.user.influx.url + '/query?';
        let creds = '';

        if (this.store.state.user.influx.username !== null && this.store.state.user.influx.username !== undefined && this.store.state.user.influx.username !== '') {
            if (this.store.state.user.influx.password !== null && this.store.state.user.influx.password !== undefined && this.store.state.user.influx.password !== '') {
                creds = 'u=' + this.store.state.user.influx.username + '&p=' + this.store.state.user.influx.password + '&';
            }
        }

        return url + creds;
    }


    testConnection() {
        let query = 'q=show+databases';
        
        return Axios.get(this.requestBase() + query)
            .then((response) => {
                if (!response.data || response.data.results.length < 1) {
                    return null;
                }
                return response.data.results;
            })
            .catch(error => {
                console.error('Can\'t connect to InfluxDB. Checkout if it\'s running. Error fetching Engine Status:', error);
            });
    }
}

//   http://localhost:8086/query?q=SELECT sum("ErrorCount") AS "sum_ErrorCount" FROM "telegraf"."autogen"."workflow_statistics" WHERE time > 1525442175144000000 GROUP BY time(10m) FILL(null)
import Axios from 'axios';
import moment from 'moment';
import { StatesPrint } from '../models/engine';

export class InfluxDBService {
    public testInfluxDB() {

        console.log('will try to connect to Influx DB');
        // http://localhost:8086/query?q=select+*+from+telegraf..cpu
        // http://localhost:8086/query?q=show+databases


        console.log(moment());
        console.log(moment().subtract(1, 'hours').toDate().getTime());
        console.log(moment().subtract(1, 'hours').unix() * 1000000000);
        let hourAgo = moment().subtract(1, 'hours').unix() * 1000000000;

        
        // TODO authentication to InfluxDB
        // u=todd & p=influxdb4ever

        // export class StatesPrint {
        //     constructor(
        //         public time: Date,
        //         public running: number,
        //         public waiting: number,
        //         public finished: number,
        //         public dequeued: number,
        //         public error: number,
        //         public invalid: number) {}

        // let query = 'SELECT mean("ErrorCount") AS "sum_ErrorCount" FROM "telegraf"."autogen"."workflow_statistics" WHERE time > ' + hourAgo + ' GROUP BY time(10m) FILL(null)';
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
                result => new StatesPrint(result[0], result[1], result[2], result[3], result[4], result[5], result[6]));

                console.log('states', states);
        })
        .catch(error => {
            console.error('Can\'t connect to InfluxDB. Checkout if it\'s running. Error fetching Engine Status:', error);
        });
    }
}

//   http://localhost:8086/query?q=SELECT sum("ErrorCount") AS "sum_ErrorCount" FROM "telegraf"."autogen"."workflow_statistics" WHERE time > 1525442175144000000 GROUP BY time(10m) FILL(null)
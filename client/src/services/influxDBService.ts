import Axios from 'axios';
import moment from 'moment';
import { StatesPrint } from '../models/engine';

export class InfluxDBService {

    url: string = 'http://localhost:8086';

    public setUrl(newUrl: string) {
        this.url = newUrl;
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

    testConnection() {
        let query = '/query?q=show+databases';
        // u=copper&p=copper

        // return Axios.get( this.url + '/query?&q=' + query)
        return Axios.get( this.url + query)
            .then(this.parseResponse)
            .catch(error => {
                console.error('Can\'t connect to InfluxDB. Checkout if it\'s running. Error fetching Engine Status:', error);
            });
    }

    parseResponse = (response) => { 
        return response.data.results;
    }

}

//   http://localhost:8086/query?q=SELECT sum("ErrorCount") AS "sum_ErrorCount" FROM "telegraf"."autogen"."workflow_statistics" WHERE time > 1525442175144000000 GROUP BY time(10m) FILL(null)
import Axios from 'axios';
import moment from 'moment';

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

        // let query = 'SELECT mean("ErrorCount") AS "sum_ErrorCount" FROM "telegraf"."autogen"."workflow_statistics" WHERE time > ' + hourAgo + ' GROUP BY time(10m) FILL(null)';
        let query = 'SELECT mean("DequeuedCount") AS "mean_DequeuedCount", mean("ErrorCount") AS "mean_ErrorCount", mean("FinishedCount") AS "mean_FinishedCount", mean("InvalidCount") AS "mean_InvalidCount", mean("RunningCount") AS "mean_RunningCount", mean("WaitingCount") AS "mean_WaitingCount" FROM "telegraf"."autogen"."persistent.engine3_statistics" WHERE time > ' + hourAgo + ' GROUP BY time(10m) FILL(null)';

        Axios.get('http://localhost:8086/query?u=copper&p=copper&q=' + query)
        .then((response) => {
            console.log('response.data.results)', response.data.results);
        })
        .catch(error => {
            console.error('Can\'t connect to InfluxDB. Checkout if it\'s running. Error fetching Engine Status:', error);
        });
    }
}

//   http://localhost:8086/query?q=SELECT sum("ErrorCount") AS "sum_ErrorCount" FROM "telegraf"."autogen"."workflow_statistics" WHERE time > 1525442175144000000 GROUP BY time(10m) FILL(null)
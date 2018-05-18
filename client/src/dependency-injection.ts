import Vue from 'vue';
import Vuec from 'vue-container';
import { JmxService } from './services/jmxService';
import { store } from './store.vuex';
import { StatisticsService } from './services/statisticsService';
import { InfluxDBService } from './services/influxDBService';

Vue.use(Vuec);

let jmxService = new JmxService();

Vue.$ioc.register('jmxService', jmxService);
Vue.$ioc.register('eventHub', new Vue());
Vue.$ioc.register('store', store);
Vue.$ioc.register('statisticsService', new StatisticsService(store, jmxService));
Vue.$ioc.register('influxService', new InfluxDBService(store));


import Vue from 'vue';
import Vuec from 'vue-container';
import { JmxService } from './services/jmxService';

Vue.use(Vuec);
Vue.$ioc.register('jmxService', new JmxService());
Vue.$ioc.register('eventHub', new Vue());
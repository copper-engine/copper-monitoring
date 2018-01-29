import Vue from 'vue';
import Vuec from 'vue-container';
import { JmxService } from './services/jmxService';
import { store } from './store.vuex';

Vue.use(Vuec);
Vue.$ioc.register('jmxService', new JmxService());
Vue.$ioc.register('eventHub', new Vue());
Vue.$ioc.register('store', store);
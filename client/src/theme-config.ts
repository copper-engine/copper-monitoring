import Vue from 'vue';
import Vuetify from 'vuetify';
import VuetifyTheme from 'vuetify';
import * as utils from './util/utils';

import 'vuetify/dist/vuetify.css';
import 'mdi/css/materialdesignicons.min.css';
import Datetime from 'vue-datetime';
import 'vue-datetime/dist/vue-datetime.css';

// import VueChartkick from 'vue-chartkick';
// Vue.use(VueChartkick);

import VueGoogleCharts from 'vue-google-charts';
Vue.use(VueGoogleCharts);

Vue.use(require('vue-moment'));
Vue.use(Vuetify);
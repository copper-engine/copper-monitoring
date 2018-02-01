import Vue from 'vue';
// import date from 'vue-date-filter';
import Vuetify from 'vuetify';
import { makeHot, reload } from './util/hot-reload';
import { createRouter } from './router';
import './dependency-injection';
import { store } from './store.vuex';
import 'vuetify/dist/vuetify.css';
import 'mdi/css/materialdesignicons.min.css';

import './main.scss';

// Vue.use(date)
Vue.use(require('vue-moment'));
Vue.use(Vuetify);

const dashboardComponent = () => import('./components/dashboard').then(({ DashboardComponent }) => DashboardComponent);
const notificationsComponent = () => import('./components/core/notifications').then(({ NotificationsComponent }) => NotificationsComponent);
// const navbarComponent = () => import(/* webpackChunkName: 'navbar' */'./components/navbar').then(({ NavbarComponent }) => NavbarComponent);

if (process.env.ENV === 'development' && module.hot) {
  const dashboardModuleId = './components/dashboard';
  const notificationsModuleId = './components/notifications';

  // first arguments for `module.hot.accept` and `require` methods have to be static strings
  // see https://github.com/webpack/webpack/issues/5668
  makeHot(notificationsModuleId, notificationsComponent,
    module.hot.accept('./components/core/notifications', () => reload(notificationsModuleId, (<any>require('./components/core/notifications')).NotificaionsComponent)));
  makeHot(dashboardModuleId, dashboardComponent,
    module.hot.accept('./components/dashboard', () => reload(dashboardModuleId, (<any>require('./components/dashboard')).DashboardComponent)));
}


(<any> window).app = new Vue({
  el: '#app',
  store,
  router: createRouter(),
  components: {
    // 'navbar': navbarComponent,
    'dashboard': dashboardComponent,
    'notifications': notificationsComponent
  }
});

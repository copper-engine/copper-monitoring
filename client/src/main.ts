import Vue from 'vue';
import 'babel-polyfill';
import { Store } from 'vuex';
// import date from 'vue-date-filter';
import { StoreState } from './store.vuex';
import Vuetify from 'vuetify';
import { makeHot, reload } from './util/hot-reload';
import './dependency-injection';
import { createRouter } from './router';
import 'vuetify/dist/vuetify.css';
import 'mdi/css/materialdesignicons.min.css';

import './main.scss';

// Vue.use(date)
Vue.use(require('vue-moment'));
Vue.use(Vuetify, {
  theme: {
    primary: '#3f51b5',
    secondary: '#f5f5f5',
    accent: '#8c9eff',
    error: '#b71c1c',
    themeText: '#000000',
    textOnColor: '#f5f5f5',
    back: '#E0E0E0'
  }
});

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
  store: (Vue.$ioc.resolve('store') as Store<StoreState>),
  router: createRouter(),
  data: {
    toggleTheme: false
  },
  components: {
    // 'navbar': navbarComponent,
    'dashboard': dashboardComponent,
    'notifications': notificationsComponent
  },
  mounted: () => {
    document.getElementById('appCover').classList.remove('initialHide');
    document.getElementById('loading').classList.add('initialHide');
  },
  watch: {
    toggleTheme: function() {
      if (this.toggleTheme === true) {
        (<any> window).app.$vuetify.theme.primary = '#00695C';
        (<any> window).app.$vuetify.theme.secondary = '#424242';
        (<any> window).app.$vuetify.theme.themeText = '#f5f5f5';
        (<any> window).app.$vuetify.theme.back = '#303030';
      }
      else {
        (<any> window).app.$vuetify.theme.primary = '#3f51b5';
        (<any> window).app.$vuetify.theme.secondary = '#f5f5f5';
        (<any> window).app.$vuetify.theme.themeText = '#000000';
        (<any> window).app.$vuetify.theme.back = '#E0E0E0';
      }
    }
  }
});
// (<any> window).app.$vuetify.theme.primary = '#b71c1c';

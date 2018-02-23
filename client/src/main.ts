import Vue from 'vue';
import { Store } from 'vuex';
import { StoreState } from './store.vuex';
import Vuetify from 'vuetify';
import { makeHot, reload } from './util/hot-reload';
import './dependency-injection';
import { createRouter } from './router';
import 'vuetify/dist/vuetify.css';
import 'mdi/css/materialdesignicons.min.css';
import * as utils from './util/utils';

if (utils.parseBoolean(localStorage.getItem('darkTheme')) === null) {
  localStorage.setItem('darkTheme', 'true');
}
// Vue.use(date)
Vue.use(require('vue-moment'));
// Vue.use(Vuetify, {
//   theme: {
//     primary: '#3f51b5',
//     secondary: '#f5f5f5',
//     accent: '#8c9eff',
//     error: '#b71c1c',
//     themeText: '#000000',
//     textOnColor: '#f5f5f5',
//     back: '#E0E0E0'
//   }
// });

if (utils.parseBoolean(localStorage.getItem('darkTheme')) === false) {
  Vue.use(Vuetify, {
    theme: {
      primary: '#0D5494',
      secondary: '#ededed',
      accent: '#E0E0E0',
      error: '#b71c1c',
      themeText: '#303030',
      textOnColor: '#f5f5f5',
      back: '#E0E0E0'
    }
  });
} else {
  Vue.use(Vuetify, {
    theme: {
      primary: '#00695C',
      secondary: '#424242',
      accent: '#616161',
      error: '#b71c1c',
      themeText: '#f5f5f5',
      textOnColor: '#f5f5f5',
      back: '#303030'
    }
  });
}

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

let app = new Vue({
  el: '#app',
  store: (Vue.$ioc.resolve('store') as Store<StoreState>),
  router: createRouter(),
  data: {
    darkTheme: utils.parseBoolean(localStorage.getItem('darkTheme')) && true
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
    darkTheme: function() {
      let theme = app.$vuetify.theme;
      if (this.darkTheme === true) {
        localStorage.setItem('darkTheme', 'true');
        theme.primary = '#00695C';
        theme.secondary = '#424242';
        theme.themeText = '#f5f5f5';
        theme.back = '#303030'; 
        theme.accent = '#616161';
      }
      else {
        localStorage.setItem('darkTheme', 'false');
        theme.primary = '#0D5494';
        theme.secondary = '#ededed';
        theme.themeText = '#303030';
        theme.back = '#E0E0E0';
        theme.accent = '#E0E0E0';
      }
    }
  }
});
// app.$vuetify.theme.primary = '#b71c1c';

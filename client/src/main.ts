import Vue from 'vue';
import { Store } from 'vuex';
import { StoreState } from './store.vuex';
import './dependency-injection';
import * as theme from './theme-config';
import { createRouter, dashboardComponent, notificationsComponent } from './router';

import './main.scss';

// import * as _ from 'lodash';
// (window as any)._ = _;

let store = (Vue.$ioc.resolve('store') as Store<StoreState>);
let app = new Vue({
  el: '#app',
  store: store,
  router: createRouter(),
  data: {},
  components: {
    'dashboard': dashboardComponent,
    'notifications': notificationsComponent
  },
  mounted: () => {
    document.getElementById('appCover').classList.remove('initialHide');
    document.getElementById('loading').classList.add('initialHide');
  },
  watch: {
    '$store.state.darkTheme': () => { ((app as any).$vuetify.theme as any) = theme.getTheme(store.state.darkTheme); }
  }
});

import Vue from 'vue';
import { Store } from 'vuex';
import { StoreState } from './store.vuex';
import VueRouter, { Location, Route, RouteConfig } from 'vue-router';
import { makeHot, reload } from './util/hot-reload';

const loginComponent = () => import('./components/login').then(({ LoginComponent }) => LoginComponent);
const dashboardComponent = () => import('./components/dashboard').then(({ DashboardComponent }) => DashboardComponent);
const workflowsComponent = () => import('./components/dashboard/workflows').then(({ WorkflowsComponent }) => WorkflowsComponent);


if (process.env.ENV === 'development' && module.hot) {
  // first arguments for `module.hot.accept` and `require` methods have to be static strings
  // see https://github.com/webpack/webpack/issues/5668
    
  const loginModuleId = './components/login';
  makeHot(loginModuleId, loginComponent,
    module.hot.accept('./components/login', () => reload(loginModuleId, (<any>require('./components/login')).LoginComponent)));

  const dashboardModuleId = './components/dashboard';
  makeHot(dashboardModuleId, dashboardComponent,
    module.hot.accept('./components/dashboard', () => reload(dashboardModuleId, (<any>require('./components/dashboard')).DashboardComponent)));

  const workflowsModuleId = './components/dashboard/workflows';
  makeHot(workflowsModuleId, workflowsComponent,
    module.hot.accept('./components/dashboard/workflows', () => reload(workflowsModuleId, (<any>require('./components/dashboard/workflows')).WorkflowsComponent)));
}

Vue.use(VueRouter);

export const createRoutes: () => RouteConfig[] = () => [
  {
    path: '/',
    component: dashboardComponent,
    meta: {
      requiresAuth: true
    }
  },
  {
    name: 'login',
    path: '/login',
    component: loginComponent,
  },
  {
    name: 'dashboard',
    path: '/dashboard',
    component: dashboardComponent,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        // WokflowsComponent will be rendered inside Dashboards's <router-view>
        // when /dashboard/workflows is matched
        name: 'workflows',
        path: 'workflows',
        component: workflowsComponent,
        meta: {
          requiresAuth: true
        }
      }
    ]
  }
];

let store: Store<StoreState> = Vue.$ioc.resolve('store');

export const createRouter = () => {
  let router = new VueRouter({ mode: 'history', routes: createRoutes(), base: process.env.ROUTING_BASE });

  router.beforeEach((to: Route, from: Route, next) => {
    let requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    
    if (requiresAuth && !store.state.user) {
      next('/login');
    } else {
      next();
    }
  });

  console.log('Router created', new Date());

  return router;
};

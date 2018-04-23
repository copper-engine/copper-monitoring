import Vue from 'vue';
import { Store } from 'vuex';
import { StoreState } from './store.vuex';
import VueRouter, { Location, Route, RouteConfig } from 'vue-router';
import { makeHot, reload } from './util/hot-reload';

import { LoginComponent } from './components/login';

export const dashboardComponent = () => import('./components/dashboard').then(({ DashboardComponent }) => DashboardComponent);
export const notificationsComponent = () => import('./components/core/notifications').then(({ NotificationsComponent }) => NotificationsComponent);
const workflowsComponent = () => import('./components/dashboard/workflows').then(({ WorkflowsComponent }) => WorkflowsComponent);
const statisticsComponent = () => import('./components/dashboard/statistics').then(({ StatisticsComponent }) => StatisticsComponent);
const workflowRepoComponent = () => import('./components/dashboard/workflow-repo').then(({ WorkflowRepository }) => WorkflowRepository);
const processorPoolsComponent = () => import('./components/dashboard/processor-pools').then(({ ProcessorPools }) => ProcessorPools);

if (process.env.ENV === 'development' && module.hot) {
  // first arguments for `module.hot.accept` and `require` methods have to be static strings
  // see https://github.com/webpack/webpack/issues/5668

  
  const loginComponent = () => import('./components/login').then(({ LoginComponent }) => LoginComponent);
  const loginModuleId = './components/login';
  makeHot(loginModuleId, loginComponent,
    module.hot.accept('./components/login', () => reload(loginModuleId, (<any>require('./components/login')).LoginComponent)));

  const notificationsModuleId = './components/notifications';
  makeHot(notificationsModuleId, notificationsComponent,
      module.hot.accept('./components/core/notifications', () => reload(notificationsModuleId, (<any>require('./components/core/notifications')).NotificaionsComponent)));
    
  const dashboardModuleId = './components/dashboard';
  makeHot(dashboardModuleId, dashboardComponent,
    module.hot.accept('./components/dashboard', () => reload(dashboardModuleId, (<any>require('./components/dashboard')).DashboardComponent)));

  const workflowsModuleId = './components/dashboard/workflows';
  makeHot(workflowsModuleId, workflowsComponent,
    module.hot.accept('./components/dashboard/workflows', () => reload(workflowsModuleId, (<any>require('./components/dashboard/workflows')).WorkflowsComponent)));

  const statisticsComponentId = './components/dashboard/statistics';
  makeHot(statisticsComponentId, statisticsComponent,
    module.hot.accept('./components/dashboard/statistics', () => reload(statisticsComponentId, (<any>require('./components/dashboard/statistics')).statisticsComponent)));
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
    component: LoginComponent,
  },
  {
    name: 'dashboard',
    path: '/dashboard',
    component: dashboardComponent,
    props: (route) => ({ host: route.query.host, port: route.query.port }),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        // WokflowsComponent will be rendered inside Dashboards's <router-view>
        // when /dashboard/workflows is matched
        name: 'workflows',
        path: 'workflows/:wfType/:id',
        component: workflowsComponent,
        meta: {
          requiresAuth: true
        }
      },
      {
        name: 'statistics',
        path: 'statistics/:type/:id',
        component: statisticsComponent,
        meta: {
          requiresAuth: true
        }
      },
      {
        name: 'workflow-repo',
        path: 'workflow-repo/:id',
        component: workflowRepoComponent,
        meta: {
          requiresAuth: true
        }
      },
      {
        name: 'processor-pools',
        path: 'processor-pools/:id',
        component: processorPoolsComponent,
        meta: {
          requiresAuth: true
        }
      }
    ]
  }
];

let store: Store<StoreState> = Vue.$ioc.resolve('store');

export class CopperRouter extends VueRouter {
  public nextPath: string;
}

export const createRouter = () => {
  let router = new CopperRouter({ 
    mode: 'history', 
    routes: createRoutes(), 
    base: process.env.ROUTING_BASE 
  });


  router.beforeEach((to: Route, from: Route, next) => {
    let requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    
    if (requiresAuth && !store.state.user) {
      router.nextPath = to.fullPath.replace(/(\/#){2,}/g, '\/#');
      next('/login');
    } else {
      next();
    }
  });
  
  return router;
};

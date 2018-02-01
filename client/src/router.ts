import Vue from 'vue';
import VueRouter, { Location, Route, RouteConfig } from 'vue-router';
import { makeHot, reload } from './util/hot-reload';

const homeComponent = () => import('./components/examples/home').then(({ HomeComponent }) => HomeComponent);
const aboutComponent = () => import('./components/examples/about').then(({ AboutComponent }) => AboutComponent);
const listComponent = () => import('./components/examples/list').then(({ ListComponent }) => ListComponent);
const dashboardComponent = () => import('./components/dashboard').then(({ DashboardComponent }) => DashboardComponent);
const workflowsComponent = () => import('./components/dashboard/workflows').then(({ WorkflowsComponent }) => WorkflowsComponent);


if (process.env.ENV === 'development' && module.hot) {
  // first arguments for `module.hot.accept` and `require` methods have to be static strings
  // see https://github.com/webpack/webpack/issues/5668
  const homeModuleId = './components/examples/home';
  makeHot(homeModuleId, homeComponent,
    module.hot.accept('./components/examples/home', () => reload(homeModuleId, (<any>require('./components/examples/home')).HomeComponent)));
    
  const aboutModuleId = './components/examples/about';
  makeHot(aboutModuleId, aboutComponent,
    module.hot.accept('./components/examples/about', () => reload(aboutModuleId, (<any>require('./components/examples/about')).AboutComponent)));
      
  const listModuleId = './components/examples/list';
  makeHot(listModuleId, listComponent,
    module.hot.accept('./components/examples/list', () => reload(listModuleId, (<any>require('./components/examples/list')).ListComponent)));

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
  },
  {
    path: '/about',
    component: aboutComponent,
  },
  {
    path: '/list',
    component: listComponent,
  },
  {
    path: '/dashboard',
    component: dashboardComponent,
    children: [
      {
        // WokflowsComponent will be rendered inside Dashboards's <router-view>
        // when /dashboard/workflows is matched
        path: 'workflows',
        component: workflowsComponent
      }
    ]
  }
];

export const createRouter = () => new VueRouter({ mode: 'history', routes: createRoutes(), base: process.env.ROUTING_BASE });

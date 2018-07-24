import Vue from 'vue';
import Vuex from 'vuex';
import { ConnectionSettings, ConnectionResult } from './models/connectionSettings';
import { EngineStatus, EngineGroup } from './models/engine';
import { User, InfluxConnection } from './models/user';
import { parseBoolean }  from './util/utils';
import * as _ from 'lodash';

Vue.use(Vuex);

export class StoreState {
  public engineStatusList: EngineStatus[] = null;
  public user: User = null;
  public connectionSettings: ConnectionSettings[] = [];
  public connectionResults: ConnectionResult[] = [];
  public appCriticalError: string = null;
  public initialTheme: boolean = parseBoolean(localStorage.getItem('darkTheme'));

  constructor() {}
}

export const Mutations = {
  updateTheme: 'updateTheme',
  setConnectionSettings: 'setConnectionSettings',
  updateConnectionSettings: 'updateConnectionSettings',
  deleteConnectionSettings: 'deleteConnectionSettings',
  updateConnectionResults: 'updateConnectionResults',
  updateEngineStatus: 'updateEngineStatus',
  setUser: 'setUser',
  setAppCriticalError: 'setAppCriticalError',
  setUseInfluxDB: 'setUseInfluxDB',
  setInfluxSettings: 'setInfluxSettings',
  setChartInterval: 'setChartInterval'
};

export const store = new Vuex.Store<StoreState>({
    state: new StoreState(),
    mutations: {
      [Mutations.updateTheme](state, darkTheme) {
        state.user.settings.darkTheme = darkTheme;
      },
      [Mutations.setAppCriticalError](state, error) {
        state.appCriticalError = error;
      },
      [Mutations.setConnectionSettings](state, connectionSettings: ConnectionSettings[]) {
        state.connectionSettings = connectionSettings;
      },
      [Mutations.updateConnectionSettings](state, { index: index, connectionSettings: connectionSettings }) {
          if (index === -1) {
            state.connectionSettings.push(connectionSettings);
          } else {
            Vue.set(state.connectionSettings, index, connectionSettings);
          }
      },
      [Mutations.deleteConnectionSettings](state, index: number) {
        state.connectionSettings.splice(index, 1);
      },
      [Mutations.updateConnectionResults](state, connectionResults) {
        state.connectionResults = connectionResults;
      },
      [Mutations.updateEngineStatus](state, engineStatusList: EngineStatus[]) {
        state.engineStatusList = engineStatusList;
      },
      [Mutations.setUser](state, user: User) {
        state.user = user;
      },
      [Mutations.setUseInfluxDB](state, input: boolean) {
        state.user.influx.useInfluxDB = input;      
      },
      [Mutations.setInfluxSettings](state, influxConnection: InfluxConnection) {  
        state.user.influx.url = influxConnection.url;
        state.user.influx.username = influxConnection.username;
        state.user.influx.password = influxConnection.password;
      },
      [Mutations.setChartInterval](state, interval: number) {  
        state.user.chart.interval = interval;
      }
    },
    getters: {
      updatePeriod: state => {
        // return state.user.settings.updatePeriod
        return 10;
      },
      fetchPeriod: state => {
        // return state.user.settings.fetchPeriod
        return 5;
      },
      connectionsAsParams: state => {
        return state.connectionSettings.map((connection: ConnectionSettings) => 'connection=' + connection.host + '|' + connection.port).join('&');
      },
      engineMBeans: state => {
        if (!state.connectionResults) 
          return [];

        return _.flatMap(state.connectionResults.map(result => result.mbeans.map(mbean => {
          mbean.name = 'copper.engine:' + mbean.name;
          return mbean;
        })));
      },
      engineMBean: state => (id: string) => {
        let engine = state.engineStatusList.find(engine => engine.id === parseInt(id));
        return engine ? engine.engineMXBean : null;
      },
      auditTrailMBeans: state => {
        return state.connectionResults.map(result => result.auditTrailsMBean);
      },
      groupsOfEngines: state => {
        if (!state.engineStatusList) 
          return null;

        let groups: EngineGroup[] = state.engineStatusList.filter((engine) => !engine.engineClusterId).map((engine) => new EngineGroup(null, [ engine ]));
        let appClusterGrouped = _(state.engineStatusList.filter((engine) => engine.engineClusterId))
          .groupBy('engineClusterId').map((engines, clusterName) => new EngineGroup( clusterName, engines)).value();
        
        return groups.concat(appClusterGrouped);
      }
    }
  });
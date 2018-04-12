import Vue from 'vue';
import Vuex from 'vuex';
import { ConnectionSettings, ConnectionResult } from './models/connectionSettings';
import { EngineStatus, EngineGroup } from './models/engine';
import { MBeans } from './models/mbeans';
import { User } from './models/user';
import { parseBoolean }  from './util/utils';
import * as _ from 'lodash';

Vue.use(Vuex);

export class StoreState {
  // TODO move to user settings
  public darkTheme = parseBoolean(localStorage.getItem('darkTheme')) && true;
  public engineStatusList: EngineStatus[] = null;
  public user: User = null;
  public connectionSettings: ConnectionSettings[] = [];
  public connectionResults: ConnectionResult[] = [];

  constructor() {}
}

export const Mutations = {
  updateTheme: 'updateTheme',
  setConnectionSettings: 'setConnectionSettings',
  updateConnectionSettings: 'updateConnectionSettings',
  deleteConnectionSettings: 'deleteConnectionSettings',
  updateConnectionResults: 'updateConnectionResults',
  updateEngineStatus: 'updateEngineStatus',
  setUser: 'setUser'
};

export const store = new Vuex.Store<StoreState>({
    state: new StoreState(),
    mutations: {
      [Mutations.updateTheme](state, darkTheme) {
        state.darkTheme = darkTheme;
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
        if (user) {
          state.connectionSettings.push(new ConnectionSettings(user.settings.defaultHost, user.settings.defaultPort));
        }
      }
    },
    getters: {
      connectionsAsParams: state => {
        return state.connectionSettings.map((connection: ConnectionSettings) => 'connection=' + connection.host + '|' + connection.port).join('&');
      },
      engineMBeans: state => {
        return _.flatMap(state.connectionResults.map(result => result.mbeans.map(mbean => {
          mbean.name = 'copper.engine:' + mbean.name;
          return mbean;
        })));
      },
      groupsOfEngines: state => {
        if (!state.engineStatusList) 
            return null;

        let groups: EngineGroup[] = state.engineStatusList.filter((engine) => !engine.appClusterId).map((engine) => new EngineGroup(null, [ engine ]));
        let appClusterGrouped = _(state.engineStatusList.filter((engine) => engine.appClusterId))
          .groupBy('appClusterId').map((engines, clusterName) => new EngineGroup( clusterName, engines)).value();
        
        return groups.concat(appClusterGrouped);
      }
    }
  });
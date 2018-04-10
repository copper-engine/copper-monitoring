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
  public darkTheme = parseBoolean(localStorage.getItem('darkTheme')) && true;
  public mbeans: MBeans = new MBeans();
  public groupsOfEngines: EngineGroup[] = null;
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
  updateMBeans: 'updateMBeans',
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
        console.log('connection settings is set in store');
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
        console.log('deleteing', index);
        state.connectionSettings.splice(index, 1);
      },
      [Mutations.updateConnectionResults](state, connectionResults) {
        state.connectionResults = connectionResults;
      },
      [Mutations.updateMBeans](state, mbeans) {
        state.mbeans = mbeans;
      },
      [Mutations.updateEngineStatus](state, engineStatusList: EngineStatus[]) {
        if (engineStatusList) {
          state.engineStatusList = engineStatusList;
          let groups: EngineGroup[] = engineStatusList.filter((engine) => !engine.dbStorageMXBean).map((engine) => new EngineGroup(null, [ engine ]));
          let dbGrouped = _(engineStatusList.filter((engine) => engine.dbStorageMXBean))
            .groupBy('dbStorageMXBean').map((engines, dbMBean) => new EngineGroup( dbMBean, engines)).value();
          
          state.groupsOfEngines = groups.concat(dbGrouped);
        } else {
          state.engineStatusList = null;
          state.groupsOfEngines = null;
        }
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
      }
    }
  });
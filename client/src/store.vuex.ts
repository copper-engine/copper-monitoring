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
  // public connectionSettings: ConnectionSettings = new ConnectionSettings();
  public connectionSettings: ConnectionSettings[] = [new ConnectionSettings('localhost', '1098'), new ConnectionSettings(), new ConnectionSettings('localhost', '1000')];
  public connectionResults: ConnectionResult[] = [];

  constructor() {}
}

export const store = new Vuex.Store<StoreState>({
    state: new StoreState(),
    mutations: {
      updateTheme(state, darkTheme) {
        state.darkTheme = darkTheme;
      },
      updateConnectionSettings(state, connectionSettings) {
        state.connectionSettings = connectionSettings;
      },
      updateConnectionResults(state, connectionResults) {
        state.connectionResults = connectionResults;
      },
      updateMBeans(state, mbeans) {
        state.mbeans = mbeans;
      },
      updateEngineStatus(state, engineStatusList: EngineStatus[]) {
        if (engineStatusList) {
          state.engineStatusList = engineStatusList;
          let groups: EngineGroup[] = engineStatusList.filter((engine) => !engine.dbStorageMXBean).map((engine) => new EngineGroup(null, [ engine ]));
          let dbGrouped = _(engineStatusList.filter((engine) => engine.dbStorageMXBean)).groupBy('dbStorageMXBean').map((engines, dbMBean) => new EngineGroup( dbMBean, engines)).value();
          
          state.groupsOfEngines = groups.concat(dbGrouped);
        } else {
          state.engineStatusList = null;
          state.groupsOfEngines = null;
        }
      },
      setUser(state, user: User) {
        state.user = user;
        if (user) {
          state.connectionSettings[0].host = user.settings.defaultHost;
          state.connectionSettings[0].port = user.settings.defaultPort;
        }
      }
    }
  });
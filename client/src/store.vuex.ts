import Vue from 'vue';
import Vuex from 'vuex';
import { ConnectionSettings } from './models/connectionSettings';
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

  constructor(public connectionSettings: ConnectionSettings) {}
}

export const store = new Vuex.Store<StoreState>({
    state: new StoreState(new ConnectionSettings()),
    mutations: {
      updateTheme(state, darkTheme) {
        state.darkTheme = darkTheme;
      },
      updateConnectionSettings(state, connectionSettings) {
        state.connectionSettings = connectionSettings;
      },
      updateMBeans(state, mbeans) {
        state.mbeans = mbeans;
      },
      updateEngineStatus(state, engineStatusList: EngineStatus[]) {
        state.engineStatusList = engineStatusList;
        let groups: EngineGroup[] = engineStatusList.filter((engine) => !engine.dbStorageMXBean).map((engine) => new EngineGroup( null, [ engine ] ));
        let dbGrouped = _(engineStatusList.filter((engine) => engine.dbStorageMXBean)).groupBy('dbStorageMXBean').map((engines, dbMBean) => new EngineGroup( dbMBean, engines)).value();
        
        state.groupsOfEngines = groups.concat(dbGrouped);
      },
      setUser(state, user: User) {
        state.user = user;
        if (user) {
          state.connectionSettings.host = user.settings.defaultHost;
          state.connectionSettings.port = user.settings.defaultPort;
        }
      }
    }
  });
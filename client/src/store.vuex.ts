import Vue from 'vue';
import Vuex from 'vuex';
import { ConnectionSettings } from './models/connectionSettings';
import { EngineStatus } from './models/engine';
import { MBeans } from './models/mbeans';
import { User } from './models/user';
import { parseBoolean }  from './util/utils';

Vue.use(Vuex);

export class StoreState {
  public darkTheme = parseBoolean(localStorage.getItem('darkTheme')) && true;
  public mbeans: MBeans = new MBeans();

  constructor(public connectionSettings: ConnectionSettings, public engineStatusList: EngineStatus[] = null, public user: User = null) {}
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
      updateEngineStatus(state, engineStatusList) {
        state.engineStatusList = engineStatusList;
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
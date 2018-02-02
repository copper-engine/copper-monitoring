import Vue from 'vue';
import Vuex from 'vuex';
import { ConnectionSettings } from './models/connectionSettings';
import { EngineStatus } from './models/engine';
import { User } from './models/user';

Vue.use(Vuex);

export class StoreState {
  constructor(public connectionSettings: ConnectionSettings, public engineStatus: EngineStatus = null, public user: User = null) {}
}

export const store = new Vuex.Store<StoreState>({
    state: new StoreState(new ConnectionSettings()),
    mutations: {
      updateConnectionSettings(state, connectionSettings) {
        state.connectionSettings = connectionSettings;
      },
      updateEngineStatus(state, engineStatus) {
        state.engineStatus = engineStatus;
      },
      setUser(state, user: User) {
        state.user = user;
      }
    }
  });
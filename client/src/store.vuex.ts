import Vue from 'vue';
import Vuex from 'vuex';
import { ConnectionSettings } from './models/connectionSettings';
import { EngineStatus } from './models/engine';

Vue.use(Vuex);

export const store = new Vuex.Store({
    state: {
      connectionSettings: new ConnectionSettings(),
      engineStatus: null
    },
    mutations: {
      updateConnectionSettings(state, connectionSettings) {
        state.connectionSettings = connectionSettings;
      },
      updateEngineStatus(state, engineStatus) {
        state.engineStatus = engineStatus;
      }
    }
  });
import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex);

import actions from "./actions"
import mutations from "./mutations"
import getters from "./getters"

let state = {
  websocket: null,
  live:false,
  ip: window.localStorage.getItem("rpc-ip") || "localhost",
  port: window.localStorage.getItem("rpc-port") || "6800",
  globalOption: {
  },
  globalStat: {
    "downloadSpeed": "--",
    "numActive": "-",
    "numStopped": "-",
    "numStoppedTotal": "-",
    "numWaiting": "-",
    "uploadSpeed": "--"
  },
  peers: [],
  toDownloads: [],
  toWaits: [],
  toFinishs: [],
};

export default new Vuex.Store({
  state,
  mutations,
  actions,
  getters
});
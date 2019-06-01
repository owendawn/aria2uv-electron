import Vue from 'vue'
import Vuex from 'vuex';
Vue.use(Vuex);
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

//import '../../assets/styles/base.stylus.styl'
import './../../assets/styles/base.scss'
//import './../../assets/styles/base.css'
import router from './router.js'
import componentLibs from '../../components/component.js'
import App from './index.vue'

componentLibs.install(Vue)

import axios from 'axios'
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.baseURL = 'http://localhost:18080'
Vue.prototype.$axios = axios

const root = document.createElement("div")
root.id = "root"
document.body.appendChild(root)

new Vue({
  el: '#root',
  router,
  render: (h)=>h(App)
})

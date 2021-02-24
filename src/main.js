import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import VueSocketIOExt from 'vue-socket.io-extended'
import { io } from 'socket.io-client'

Vue.config.productionTip = true
Vue.config.devtools = true

// Vue.use(Vuex)
var api
if (process.env.NODE_ENV !== 'production') {
  api = 'https://api.beta.cards.adamhodgkinson.dev'
} else { api = 'api.cards.adamhodgkinson.dev' }
const customURI = new URLSearchParams(location.search).get('apiuri')
if (customURI) {
  api = customURI
}
const socket = io(api, {
  auth: {
    token: ''
  }
})
Vue.use(VueSocketIOExt, socket, { store })

const v = new Vue({
  router,
  store,
  render: h => h(App),
  methods: {

  }
}).$mount('#app')

console.log('hi')
socket.auth.token = v.$store.state.secret

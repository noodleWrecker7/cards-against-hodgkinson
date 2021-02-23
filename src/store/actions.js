export default {
  socket_welcometoserver (context, data) {
    console.log('welcome message recieved')
    console.log(data)
    context.commit('setVersionName', data)
    if (context.state.UID) {
      this._vm.$socket.client.emit('returningsession', context.state.UID)
    }
  },
  logOut (context) {
    context.commit('setLoggedIn', false)
    context.commit('setUsername', '')
    context.commit('setUID', '')
  },
  logIn (context, data) {
    context.commit('setLoggedIn', true)
    context.commit('setUsername', data.name)
    context.commit('setUID', data.uid)
  },

  socket_lobbiestoclient (context, data) {
    console.log('lobbies recieve')
    context.commit('setLobbiesList', data)
  },
  setGID (context, data) {
    context.commit('setGID', data)
  },
  socket_sendplayerwhitecards (context, data) {

  },
  socket_sendallgamedata (context, data) {
    console.log('gamedata')
    console.log(data)
    context.commit('setGameData', data)
  },

  socket_playerlist (context, data) {
    console.log(data)
    context.commit('setPlayerList', data)
  }
}

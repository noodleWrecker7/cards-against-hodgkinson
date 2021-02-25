export default {
  socket_welcometoserver (context, data) {
    console.log('welcome message recieved')
    console.log(data)
    context.commit('setVersionName', data)
    if (context.state.UID) {
      this._vm.$socket.client.emit('returningsession', { uid: context.state.UID })
    }
  },
  logOut (context) {
    context.commit('setLoggedIn', false)
    context.commit('setUsername', '')
    context.commit('setUID', '')
    context.commit('setSecret', '')
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
  setPlayerWhiteCards (context, data) {
    context.commit('setPlayerWhiteCards', data)
  },
  socket_sendgameinfo (context, data) {
    console.log('gamedata')
    console.log(data)
    context.commit('setGameData', data)
  },

  socket_playerlist (context, data) {
    console.log(data)
    context.commit('setPlayerList', data)
  },
  socket_setstate (context, data) {
    if (context.state.state !== data) {
      this._vm.$router.go(data)
    }
    context.commit('setState', data)
  },
  socket_sendplayerwhitecards (context, data) {
    context.commit('setPlayerWhiteCards', data)
  },
  socket_comegetwhitecards (context) {
    console.log('white cards ready')

    this._vm.$socket.client.emit('requestwhitecards',
      { uid: context.state.UID, gid: context.state.GID },
      function (response) {
        if (!response.error) {
          context.commit('setPlayerWhiteCards', response.data)
        } else if (response.error === 'rate limit') {
          setTimeout(() => {
            this.socket_comegetwhitecards(context)
          }, 1000, context)
        } else if (response.error === 'no card data') {
          console.error('Server could not find white cards')
        }
      }
    )
  }
}

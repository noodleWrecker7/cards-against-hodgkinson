export default {
  socket_welcometoserver (context, data) {
    console.log('welcome message recieved')
    console.log(data)
    context.commit('setVersionName', data)
    if (context.state.UID) {
      this._vm.$socket.client.emit('returningsession', context.state.UID)
    }
    // todo - if hasUsername {be that user/alert server get where should be etc}
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
  }
}

export default {
  socket_welcometoserver (context, data) {
    console.log('welcome message recieved')
    console.log(data)
    context.commit('setVersionName', data)
  },
  logOut (context) {
    context.commit('setLoggedIn', false)
    context.commit('setUsername', '')
  }
}

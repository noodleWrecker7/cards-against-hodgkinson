// Short hands for setting data
module.exports = (database) => {
  return {
    userState (uid, value) {
      this.set('users/' + uid + '/state', value)
    },
    set (ref, value) {
      database.ref(ref).set(value)
    },
    czar (gid, value) {
      this.set('gameStates/' + gid + '/gameplayInfo/czar', value)
    },
    gamePlayerDoing (gid, uid, value) {
      this.set('gameStates/' + gid + '/players/' + uid + '/doing', value)
    }
  }
}

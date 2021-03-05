// Short hands for setting data
module.exports = (database) => {
  return {
    userState (uid, value) {
      return this.set('users/' + uid + '/state', value)
    },
    set (ref, value) {
      return database.ref(ref).set(value)
    },
    czar (gid, value) {
      return this.set('gameStates/' + gid + '/gameplayInfo/czar', value)
    },
    gamePlayerDoing (gid, uid, value) {
      return this.set('gameStates/' + gid + '/players/' + uid + '/doing', value)
    },
    playerScore (gid, uid, value) {
      return this.set('gameStates/' + gid + '/players/' + uid + '/points', value)
    },
    playedCards (gid, value) {
      return this.set('gameStates/' + gid + '/playedCards', value)
    }
  }
}

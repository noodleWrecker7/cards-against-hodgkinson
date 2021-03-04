// Short hands for getting data
module.exports = (database) => {
  return {
    usersWhiteCards (uid, gid) {
      return this.getOnce('/gameStates/' + gid + '/whiteCardsData/' + uid)
    },
    lobbies () {
      return new Promise((resolve) => {
        database.ref('gameDisplayInfo').orderByChild('isPrivate').equalTo(false).once('value', (snap) => {
          resolve(snap.val())
        })
      })
    },
    whiteCardsData (gid) {
      return this.getOnce('gameStates/' + gid + '/whiteCardsData')
    },
    gamePlayers (gid) {
      return this.getOnce('gameStates/' + gid + '/players')
    },
    userState (uid) {
      return this.getOnce('users/' + uid + '/state')
    },
    game (gid) {
      return this.getOnce('gameStates/' + gid)
    },
    gameplayInfo (gid) {
      return this.getOnce('gameStates/' + gid + '/gameplayInfo')
    },
    playedCards (gid) {
      return this.getOnce('gameStates/' + gid + '/playedCards')
    },
    gameplayState (gid) {
      return this.getOnce('gameStates/' + gid + '/gameplayInfo/state')
    },
    username (uid) {
      return this.getOnce('users/' + uid + '/name')
    },
    czar (gid) {
      return this.getOnce('gameStates/' + gid + '/gameplayInfo/czar')
    },
    getOnce (ref) {
      return new Promise((resolve, reject) => {
        database.ref(ref).once('value').then((snap) => {
          if (snap.exists()) {
            resolve(snap.val())
          } else {
            const err = new Error('Could not get data: ' + ref)
            console.log(err.stack)
            reject(err)
          }
        })
      })
    }
  }
}

// Short hands for getting data
module.exports = (database) => {
  return {
    usersWhiteCards (uid: string, gid: string) {
      return this.getOnce('/gameStates/' + gid + '/whiteCardsData/' + uid)
    },
    lobbies () {
      return new Promise((resolve) => {
        database.ref('gameDisplayInfo').orderByChild('isPrivate').equalTo(false).once('value', (snap) => {
          resolve(snap.val())
        })
      })
    },
    whiteCardsData (gid: string) {
      return this.getOnce('gameStates/' + gid + '/whiteCardsData')
    },
    gamePlayers (gid: string) {
      return this.getOnce('gameStates/' + gid + '/players')
    },
    playerScore (gid: string, uid: string) {
      return this.getOnce('gameStates/' + gid + '/players/' + uid + '/points')
    },
    userState (uid: string) {
      return this.getOnce('users/' + uid + '/state')
    },
    game (gid: string) {
      return this.getOnce('gameStates/' + gid)
    },
    gameplayInfo (gid: string) {
      return this.getOnce('gameStates/' + gid + '/gameplayInfo')
    },
    playedCards (gid: string) {
      return this.getOnce('gameStates/' + gid + '/playedCards')
    },
    usersPlayedCards (gid: string, uid: string) {
      return this.getOnce('gameStates/' + gid + '/playedCards/' + uid)
    },
    gameplayState (gid: string) {
      return this.getOnce('gameStates/' + gid + '/gameplayInfo/state')
    },
    username (uid: string) {
      return this.getOnce('users/' + uid + '/name')
    },
    czar (gid: string) {
      return this.getOnce('gameStates/' + gid + '/gameplayInfo/czar')
    },
    getOnce (ref: string) {
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

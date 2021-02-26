module.exports = (io, database) => {
  return {
    getWhiteCards (data) {
      return new Promise((resolve, reject) => {
        database.ref('/gameStates/' + data.gid + '/whiteCardsData/' + data.uid + '/inventory').once('value').then((snap) => {
          if (snap.exists()) {
            resolve(snap.val())
          } else {
            reject(new Error('no card data'))
          }
        })
      })
    }
  }
}

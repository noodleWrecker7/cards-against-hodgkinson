// Database update listeners
module.exports = (io, database) => {
  database.ref('gameStates').on('child_added', (snap) => {
    const id = snap.key
    database.ref('gameStates/' + id + '/gameplayInfo').on('value', (snap) => {
      console.log('game info update')
      console.log({ id })
      io.to(id).emit('sendgameinfo', snap.val())
    })

    database.ref('gameStates/' + id + '/players').on('value', (snap) => {
      /*      if (!snap.exists()) {
      } else if (snap.val() == null) {
      } else { */
      io.to(id).emit('playerlist', snap.val())
      if (snap.exists()) {
        database.ref('gameDisplayInfo/' + id + '/playerCount').set(Object.keys(snap.val()).length)
      }
      // }
    })

    database.ref('gameStates/' + id + '/playedCards').on('value', (snap) => {
      io.to(id).emit('topcards', snap.val())
    })

    database.ref('gameStates/' + id + '/whiteCardsData').on('value', () => {
      console.log('white card update')
      io.to(id).emit('comegetwhitecards', { gid: id })
    })
  })

  database.ref('gameStates').on('child_removed', (snap) => {
    const id = snap.key
    database.ref('gameStates/' + id + '/gameplayInfo').off('value')

    database.ref('gameStates/' + id + '/players').off('value')
  })

  // Caching some firebase routes
  database.ref('users').on('value', function () {
    // to keep the data cached
  })
}

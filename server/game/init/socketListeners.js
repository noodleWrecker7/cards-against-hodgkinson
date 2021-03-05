// All socket.ons go here
module.exports = (io, funcs, handleCall, cb) => {
  io.on('connection', function (socket) {
    // handle sockets
    socket.emit('welcometoserver', process.env.GAE_VERSION ? process.env.GAE_VERSION : 'Beta')

    //
    socket.on('applyforusername', function (data) {
      // console.log('apply for username')
      funcs.applyforusername(data, socket)
    })

    socket.on('returningsession', function (data) {
      // console.log('returning session')
      handleCall(data.uid, socket).then(() => {
        funcs.returningsession(data.uid, socket)
      })
    })

    socket.on('creategame', function (data) {
      // console.log('creategame')
      handleCall(data.uid, socket).then(() => {
        funcs.attemptCreateGame(data, socket)
      })
    })

    socket.on('arriveatgamepage', function (data) {
      // console.log('arrivegamepage')
      handleCall(data.uid, socket).then(() => {
        funcs.arriveAtGamePage(data, socket)
      })
    })

    socket.on('startgame', function (data) {
      // console.log('start game')
      handleCall(data.uid, socket).then(() => {
        funcs.startGame(data.uid, data.gid, socket)
      })
    })

    socket.on('logout', async function (data) {
      // console.log('logout')
      handleCall(data.uid, socket).then(() => {
        funcs.logout(data.uid, socket)
      })
    })

    socket.on('selectcards', function (data, callback) {
      // console.log('selectcards')
      handleCall(data.uid, socket).then(() => {
        funcs.selectCards(data.uid, data.gid, data.cards, callback)
      }).catch((err) => {
        if (err.message === 'rate limit') {
          callback({ failed: 'rate limit' })
        }
      })
    })

    socket.on('czarpickcard', function (data) {
      handleCall(data.uid, socket).then(() => {
        funcs.czarPicksCard(data.gid, data.uid, data.winner, socket)
      })
    })

    //
    socket.on('requestwhitecards', function (data, callback) {
      // console.log('reqwhitecards')
      cb.requestwhitecards(data, callback, socket)
    })

    socket.on('requestlobbies', function (data, callback) {
      // console.log('reqlobbies')
      cb.requestlobbies(data, callback, socket)
    })
  })
}

// todo
//  require game code separately
//  getters setter methods?
//  - have clientside getters with callbacks so client can request
//  - and have straight broadcasts that just tell the socket to have some data
//  - have the above as methods which accept the socket as an arg then get the data from the db
//  another file to have all the db listeners set up too - must be given io to exporst method

// Setup rate limiter

module.exports = (io, database) => {
  // const methods = require('./socketMethods')(io, database)
  const getData = require('./getData')(database)
  const utils = require('./utils')(database)
  const emitters = require('./clientEmitters')(database, getData)
  const cb = require('./clientCBRequests')(getData, utils)
  const setData = require('./setData')()
  const funcs = require('./gameFuncs')(io, database, utils, getData, setData, emitters)

  setInterval(funcs.clearInactiveUsers, 1800000)

  io.on('connection', function (socket) {
    // handle sockets
    socket.emit('welcometoserver', process.env.GAE_VERSION ? process.env.GAE_VERSION : 'Beta')

    //
    socket.on('applyforusername', function (data) {
      console.log('apply for username')
      funcs.applyforusername(data, socket)
    })

    socket.on('returningsession', function (data) {
      console.log('returning session')
      utils.handleCall(data.uid, socket).then(() => {
        funcs.returningsession(data.uid, socket)
      })
    })

    socket.on('creategame', function (data) {
      console.log('creategame')
      utils.handleCall(data.uid, socket).then(() => {
        funcs.attemptCreateGame(data, socket)
      })
    })

    socket.on('arriveatgamepage', function (data) {
      console.log('arrivegamepage')
      utils.handleCall(data.uid, socket).then(() => {
        funcs.arriveAtGamePage(data, socket)
      })
    })

    socket.on('startgame', function (data) {
      console.log('start game')
      utils.handleCall(data.uid, socket).then(() => {
        funcs.startGame(data.uid, data.gid, socket)
      })
    })

    socket.on('logout', async function (data) {
      console.log('logout')
      utils.handleCall(data.uid, socket).then(() => {
        funcs.logout(data.uid, socket)
      })
    })

    socket.on('selectcards', function (data, callback) {
      console.log('selectcards')
      utils.handleCall(data.uid, socket).then(() => {
        funcs.selectCards(data.uid, data.gid, data.cards, callback)
      }).catch((err) => {
        if (err.message === 'rate limit') {
          callback({ failed: 'rate limit' })
        }
      })
    })

    //
    socket.on('requestwhitecards', function (data, callback) {
      console.log('reqwhitecards')
      cb.requestwhitecards(data, callback, socket)
    })

    socket.on('requestlobbies', function (data, callback) {
      console.log('reqlobbies')
      cb.requestlobbies(data, callback, socket)
    })
  })
}

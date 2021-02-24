console.log('Server Starting')
console.time('Started server in')
var origin
if (process.env.buildmode !== 'production') {
  console.log('Currently running on beta branch')
  origin = 'http://localhost:8080'
} else {
  console.log('Current Build: #' + process.env.GAE_VERSION)
  require('@google-cloud/debug-agent').start({ serviceContext: { enableCanary: false } })
  origin = 'https://cards.adamhodgkinson.dev'
}
console.time('Loaded black cards in')
const blackCards = require('./../data/black.json')
const blackCardsLength = blackCards.length
console.timeEnd('Loaded black cards in')

console.time('Loaded white cards in')
const whiteCards = require('./../data/white.json')
const whiteCardsLength = whiteCards.length
console.timeEnd('Loaded white cards in')

// eslint-disable-next-line no-unused-vars
function getBlackCard () {
  const r = Math.random() * blackCardsLength
  return blackCards[r]
}

// eslint-disable-next-line no-unused-vars
function getWhiteCard () {
  const r = Math.random() * whiteCardsLength
  return whiteCards[r]
}

var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http, {
  cors: {
    origin: origin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true,
    allowEIO3: true
  }
})

var firebase = require('firebase/app')

require('firebase/auth')
require('firebase/database')

const firebaseConfig = require('./../firebaseauth.json')

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

var database = firebase.database()
database.ref('users').on('value', function () {
// to keep the data cached
})

io.on('connection', function (socket) {
  // handle sockets
  console.log('connection received')
  console.log(socket.handshake.auth)

  socket.emit('welcometoserver', process.env.GAE_VERSION ? process.env.GAE_VERSION : 'Beta')

  socket.on('applyforusername', function (data) {
    applyforusername(data, socket)
  })

  socket.on('returningsession', function (data) {
    console.time('returningsession ' + data.uid)
    authenticateMessage(data.uid, socket.handshake.auth.token, socket).then(() => {
      returningsession(data.uid, socket)
    }).catch(() => {
    })
    console.timeEnd('returningsession ' + data.uid)
  })

  socket.on('requestlobbies', function (data) {
    console.log(socket.handshake.auth)
    requestlobbies(data, socket)
  })

  socket.on('creategame', function (data) {
    console.time('creategame by ' + data.uid)
    authenticateMessage(data.uid, socket.handshake.auth.token, socket).then(() => {
      attemptCreateGame(data, socket)
    }).catch(() => {
    })
    console.timeEnd('creategame by ' + data.uid)
  })

  socket.on('arriveatgamepage', function (data) {
    arriveAtGamePage(data, socket)
  })

  socket.on('startgame', function (data) {
    console.time('startgame by ' + data.uid)
    authenticateMessage(data.uid, socket.handshake.auth.token, socket).then(() => {
      startGame(data.gid, data.uid)
    }).catch(() => {
    })
    console.timeEnd('startgame by ' + data.uid)
  })

  socket.on('logout', async function (data) {
    console.time('logout ' + data.uid)
    authenticateMessage(data.uid, socket.handshake.auth.token, socket).then(() => {
      logout(data.uid, socket)
    }).catch(() => {
      // todo error handle
      //  - remove user from any active games
    })
    console.timeEnd('logout ' + data.uid)
  })
})

function startGame (uid, gid) {
  database.ref()
}

function authenticateMessage (uid, secret, socket) {
  console.time('authenticating ' + uid)
  database.ref('users/' + uid + '/lastSeen').set(Date.now())
  return new Promise((resolve, reject) => {
    database.ref('users/' + uid + '/secret').once('value', (snap) => {
      console.timeEnd('authenticating ' + uid)
      if (secret === snap.val()) {
        resolve()
      } else {
        socket.emit('secretnotmatch')
        reject(new Error('secretnotmatch'))
      }
    }).catch((reason) => {
      console.log(reason)
      console.timeEnd('authenticating ' + uid)
      reject(new Error('usernotfound'))
    })
  })
}

function logout (uid, socket) {
  database.ref('users/' + uid + '/state').get().then((snap) => {
    if (!snap.exists()) return
    const state = snap.val()
    if (state.includes('GID')) {
      console.log('logged out user has game')
      const gid = state.substring(state.indexOf('GID') + 3)
      removePlayerFromGame(uid, gid, socket)
    }
  })
  database.ref('users/' + uid).remove()
}

// eslint-disable-next-line no-unused-vars
function removePlayerFromGame (uid, gid, socket) {
  if (socket) {
    socket.leave(gid)
  }
// todo implement player removing
}

// todo add spectator functionality
function arriveAtGamePage (data, socket) {
  database.ref('gameStates/' + data.gid).get().then((gamesnap) => {
    if (!gamesnap.exists()) {
      socket.emit('gamenotfound')
    } else {
      database.ref('users/' + data.uid + '/state').get().then((usersnap) => {
        if (!usersnap.exists()) { // no user
          socket.emit('returningsessioninvalid')
          return
        }
        socket.join(data.gid) // join to game channel for socket emissions

        if (gamesnap.val().whiteCardsData && gamesnap.val().whiteCardsData[data.uid]) {
          socket.emit('sendplayerwhitecards', gamesnap.val().whiteCardsData[data.uid])
        }

        if (usersnap.val().includes('game')) { // if already in a game
          removePlayerFromGame(data.uid, data.gid, socket)
        }
        joinPlayerToGame(data.uid, data.gid)

        sendData('sendgameinfo', 'gameStates/' + data.gid + '/gameplayInfo', socket)
        sendData('playerlist', 'gameStates/' + data.gid + '/players', socket)
      })
    }
  })
}

function sendData (message, ref, socket) {
  database.ref(ref).once('value').then((snap) => {
    socket.emit(message, snap.val())
  })
}

function joinPlayerToGame (uid, gid) {
  console.log('join player to game')
  database.ref('users/' + uid + '/name').get().then((snap) => {
    database.ref('gameStates/' + gid + '/players/' + uid).set({
      name: snap.val(),
      points: 0,
      hasPlayed: false
    })
    database.ref('gameStates/' + gid + '/players').get().then((gsnap) => {
      database.ref('gameDisplayInfo/' + gid + '/playerCount').set(Object.keys(gsnap.val()).length)
    })
    database.ref('users/' + uid + '/state').set('/game/' + gid)
  })
}

function attemptCreateGame (data, socket) {
  console.log('requested to make game')
  console.log()
  const id = createGame(data.title, data.maxPlayers, data.uid, data.maxRounds, data.isPrivate, data.ownerName)
  socket.emit('gamecreatedsuccess', id)

  database.ref('gameStates/' + id + '/gameplayInfo').on('value', (snap) => {
    console.log('game info update')
    io.to(id).emit('sendgameinfo', snap.val())
  })

  database.ref('gameStates/' + id + '/players').on('value', (snap) => {
    console.log('players update')
    io.to(id).emit('playerlist', snap.val())
  })
}

function requestlobbies (data, socket) {
  database.ref('gameDisplayInfo').orderByChild('isPrivate').equalTo(false).once('value', (snap) => {
    if (!snap.exists()) return
    socket.emit('lobbiestoclient', snap.val())
  })
}

function createGame (name, maxPlayer, owner, maxRounds, isPrivate, ownerName) {
  var id = 'GID' + generateID()
  var display = { name: name, ownerName: ownerName, playerCount: 1, maxPlayers: maxPlayer, isPrivate: isPrivate }
  var gameState = {
    name: name,
    spectators: [],
    whiteCardsData: {
      [owner]: {
        inventory: [],
        played: [],
        x: ''// this is to avoid firebase deleting the whole object for being empty
      }
    },
    gameplayInfo: {
      round: 0,
      maxRounds: maxRounds,
      creatorUID: owner,
      playedCards: 0,
      state: 'not started'
    },
    players: {}
  }
  database.ref('gameDisplayInfo/' + id).set(display)
  database.ref('gameStates/' + id).set(gameState)
  return id
}

// todo use a secret key that the user must provide to authenticate themselves
//  then either check that every time they do something
//  or check their socket every time but only let them change the socket with the key
//  i think the first is better bc theres no need to store/update/pass the socketid around - a key shouldnt change too
function returningsession (uid, socket) {
  database.ref('users/' + uid).once('value', (snap) => {
    if (!snap.exists()) {
      socket.emit('returningsessioninvalid')
    } else {
      const val = snap.val()
      socket.emit('returningsessionaccepted', { name: val.name, state: val.state })
      const updates = { currentSocket: socket.id }
      database.ref('users/' + uid).update(updates)
    }
  })
}

function applyforusername (data, socket) {
  data = escapeHtml(data)
  // name doesnt need to be unique
  // const ref = database.ref('users').orderByChild('name').equalTo(data)
  // ref.once('value', (snap) => {
  // console.log(snap.val())
  if (socket === null) return
  /* if (snap.val() != null) {
      socket.emit('usernameunavailable', data)
    } else { */
  const uid = 'UID' + generateID()
  const secret = 'SEC' + generateID()
  database.ref('users/' + uid).set({
    UID: uid,
    name: data,
    currentSocket: socket.id,
    secret: secret,
    state: '/lobby' // current position in the flow eg game lobby etc
  }).then(() => {
    socket.emit('usernameaccepted', { uid: uid, name: data, state: '/lobby', secret: secret })
  })
  // }
  // })
}

function generateID () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!£^*()'
  let str = (new Date()).toTimeString().substr(0, 8).replace(/:/g, '')
  for (let i = 0; i < 4; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return str
}

app.get('/*', function (request, response) {
  console.log(request.path)
  response.send('<html lang="uk"><script>window.location.href="https://cards.adamhodgkinson.dev?apiuri=" + window.location.hostname</script></html>')
})
const PORT = process.env.PORT || 1984

http.listen(PORT, () => {
  console.log('Listening on: ' + PORT)
  if (process.argv.includes('test')) {
    test()
  }
  console.time('Registered Listeners in')
  registerListeners()
  console.timeEnd('Registered Listeners in')
  clearInactiveUsers()
  setInterval(clearInactiveUsers, 3600000)
  console.timeEnd('Started server in')
})

function test () {
  var ref = database.ref('test')
  ref.get().then(function (data) {
    if (data.val() !== 'hi') {
      throw new Error('DB connection failed')
    }
    console.log('Connected to database')
    console.log('Testing complete\n\nExiting...')
    process.exit()
  })
}

module.exports.PORT = PORT
module.exports.http = http

function escapeHtml (unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function clearInactiveUsers () {
  // 1800000
  const cutoff = Date.now() - 1800000 // 30 mins ago
  database.ref('users').orderByChild('lastSeen').endBefore(cutoff).once('value').then((snap) => {
    logout(snap.key)
  })
}

function registerListeners () {
  database.ref('gameStates').on('child_added', (snap) => {
    const id = snap.key
    database.ref('gameStates/' + id + '/gameplayInfo').on('value', (snap) => {
      console.log('game info update')
      io.to(id).emit('sendgameinfo', snap.val())
    })

    database.ref('gameStates/' + id + '/players').on('value', (snap) => {
      console.log('players update')
      io.to(id).emit('playerlist', snap.val())
    })
  })

  database.ref('gameStates').on('child_removed', (snap) => {
    const id = snap.key
    database.ref('gameStates/' + id + '/gameplayInfo').off('value')

    database.ref('gameStates/' + id + '/players').off('value')
  })
}

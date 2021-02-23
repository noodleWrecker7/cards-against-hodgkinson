console.log('Server Starting')

var origin
if (process.env.buildmode !== 'production') {
  console.log('Currently running on beta branch')
  origin = 'http://localhost:8080'
} else {
  console.log('Current Build: #' + process.env.GAE_VERSION)
  require('@google-cloud/debug-agent').start({ serviceContext: { enableCanary: false } })
  origin = 'https://cards.adamhodgkinson.dev'
}
const blackCards = require('./../data/black.json')
const blackCardsLength = blackCards.length
console.log('Loaded %s black cards', blackCardsLength)
const whiteCards = require('./../data/white.json')
const whiteCardsLength = whiteCards.length
console.log('Loaded %s white cards', whiteCardsLength)

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

io.on('connection', function (socket) {
  // handle sockets
  console.log('connection received')

  socket.emit('welcometoserver', process.env.GAE_VERSION ? process.env.GAE_VERSION : 'Beta')

  socket.on('applyforusername', function (data) {
    applyforusername(data, socket)
  })

  socket.on('returningsession', function (data) {
    returningsession(data, socket)
  })

  socket.on('requestlobbies', function (data) {
    requestlobbies(data, socket)
  })

  socket.on('creategame', function (data) {
    attemptCreateGame(data, socket)
  })

  socket.on('arriveatgamepage', function (data) {
    arriveAtGamePage(data, socket)
  })

  socket.on('logout', logout)
}
)

function logout (data) {
  database.ref('users/' + data + '/state').get().then((snap) => {
    if (!snap.exists()) return
    const state = snap.val()
    if (state.includes('GID')) {
      console.log('logged out user has game')
      const gid = state.substring(state.indexOf('GID'))
      removePlayerFromGame(data, gid)
    }
  })
  database.ref('users/' + data).remove()
}

// eslint-disable-next-line no-unused-vars
function removePlayerFromGame (uid, gid, socket) {
  socket.leave(gid)
// todo implement player removing
}

// todo add spectator functionality
function arriveAtGamePage (data, socket) {
  database.ref('gameStates/' + data.gid).get().then((gamesnap) => {
    if (!gamesnap.exists()) {
      socket.emit('gamenotfound')
    } else {
      database.ref('users/' + data.uid + '/state').get().then((usersnap) => {
        if (!usersnap.exists()) {
          socket.emit('returningsessioninvalid')
          return
        }
        socket.join(data.gid)

        if ((gamesnap.val().players && Object.keys(gamesnap.val().players).includes(data.uid)) || (gamesnap.val().spectators && gamesnap.val().spectators.includes(data.uid))) { // if user is already in game, or spectator
          // do nothing?
          // fixme hide player uids when sending
          //  or add a secret key for a uid that is checked at start of every call
          socket.emit('sendallgamedata', gamesnap.val().gameplayInfo)
          if (Object.keys(gamesnap.val().whiteCardsData).includes(data.uid)) {
            socket.emit('sendplayerwhitecards', gamesnap.val().whiteCardsData[data.uid].inventory)
          }
        } else {
          if (usersnap.val().includes('game')) { // if already in a game
            removePlayerFromGame(data.uid, data.gid, socket)
          }
          joinPlayerToGame(data.uid, data.gid)
          // socket.emit('sendallgamedata', gamesnap.val().gameplayInfo)
          // socket.emit('sendplayerwhitecards', gamesnap.val().whiteCardsData[data.uid].inventory)
          /* const players = []
          for (let i = 0; Object.keys(gamesnap.val().players).length; i++) {
            players.push(gamesnap.val().players[Object.keys(gamesnap.val().players)[i]])
          } */
          // socket.emit('playerlist', players)
        }
      })
    }
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
    database.ref('users/' + uid + '/state').set('game/' + gid)
  })
}

function attemptCreateGame (data, socket) {
  console.log('requested to make game')
  database.ref('users/' + data.uid + '/currentSocket').once('value', (snap) => {
    if (!snap.exists()) {
      socket.emit('returningsessioninvalid')
      return
    }
    if (snap.val() === socket.id) {
      console.log()
      const id = createGame(data.title, data.maxPlayers, data.uid, data.maxRounds, data.isPrivate, data.ownerName)
      socket.emit('gamecreatedsuccess', id)

      database.ref('gameStates/' + id + '/gameplayInfo').on('value', (snap) => {
        global.gc()
        console.log('game info update')
        io.to(id).emit('sendallgamedata', snap.val())
      })

      database.ref('gameStates/' + id + '/players').on('value', (snap) => {
        global.gc()
        console.log('players update')
        const players = []
        if (!snap.exists()) return
        for (let i = 0; i < Object.keys(snap.val()).length; i++) {
          players.push(snap.val()[Object.keys(snap.val())[i]])
        }
        io.to(id).emit('playerlist', players)
      })
    }
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

function returningsession (data, socket) {
  database.ref('users/' + data).once('value', (snap) => {
    if (!snap.exists()) {
      socket.emit('returningsessioninvalid')
    } else {
      const val = snap.val()
      socket.emit('returningsessionaccepted', { name: val.name, state: val.state })
      const updates = { currentSocket: socket.id }
      database.ref('users/' + data).update(updates)
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
  database.ref('users/' + uid).set({
    UID: uid,
    name: data,
    currentSocket: socket.id,
    state: '/lobby' // current position in the flow eg game lobby etc
  }).then(() => {
    socket.emit('usernameaccepted', { uid: uid, name: data, state: '/lobby' })
  })
  // }
  // })
}

function generateID () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!£%^*()'
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

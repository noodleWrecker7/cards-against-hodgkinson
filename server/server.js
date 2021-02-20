console.log('Server Starting')

var origin
if (process.env.buildmode !== 'production') {
  console.log('Currently running on beta branch')
  origin = 'http://localhost:8080'
} else {
  console.log('Current Build: ' + process.env.GAE_VERSION)
  origin = 'https://cards.adamhodgkinson.dev'
}

// todo express, socket.io, sysinfo

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
}
)

function attemptCreateGame (data, socket) {
  database.ref('users/' + data.uid + '/currentSocket').once('value', (snap) => {
    if (!snap.exists()) return // todo emit failed create
    if (snap.val().currentSocket === socket.id) {
      createGame(data.name, data.maxPlayers, data.ownerID)
    }
  })
}

function requestlobbies (data, socket) {
  database.ref('gameDisplayInfo').once('value', (snap) => {
    if (!snap.exists()) return
    socket.emit('lobbiestoclient', snap.val())
  })
}

function createGame (name, maxPlayer, owner) {
  var id = 'GID' + generateID()
  var display = { name: name, ownerID: owner, playerCount: 0, maxPlayers: maxPlayer }
  var gameState = { state: 0 }
  database.ref('gameDisplayInfo/' + id).set(display)
  database.ref('gameStates/' + id).set(gameState)
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
    state: 'lobby' // current position in the flow eg game lobby etc
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
  response.send('<html><script>window.location.href="cards.adamhodgkinson.dev"</script></html>')
})
const PORT = process.env.PORT || 1984

http.listen(PORT, () => {
  console.log('Listening on: ' + PORT)
  if (process.argv.includes('test')) { test() }
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

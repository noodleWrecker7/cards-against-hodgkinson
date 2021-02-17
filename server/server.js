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

const firebaseConfig = {}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)
var database = firebase.database()
var ref = database.ref('test')
ref.get().then(function (data) {
  console.log(data)
})
const PORT = process.env.PORT || 1984

io.on('connection', function (socket) {
  // handle sockets
  console.log('connection received')

  socket.emit('welcometoserver', process.env.GAE_VERSION ? process.env.GAE_VERSION : 'Beta')

  socket.on('applyforusername', function (data) {
    applyforusername(data, socket)
  })
}
)

function applyforusername (data, socket) {

}

app.get('/*', function (request, response) {
  console.log(request.path)
  response.send('<html><script>window.location.href="cards.adamhodgkinson.dev"</script></html>')
})

http.listen(PORT, () => {
  console.log('Listening on:' + PORT)
})

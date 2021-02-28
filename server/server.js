console.log('Server Starting')
console.time('Started server in')

// Setting origin header
let origin
if (process.env.buildmode !== 'production') {
  console.log('Currently running on beta branch')
  origin = '*'
} else {
  console.log('Current Build: #' + process.env.GAE_VERSION)
  require('@google-cloud/debug-agent').start({ serviceContext: { enableCanary: false } })
  origin = 'https://cards.adamhodgkinson.dev'
}

// Loading cards

// Starting request handler
const PORT = process.env.PORT || 1984
const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http, {
  cors: {
    origin: origin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true,
    allowEIO3: true
  }
})

// Starting firebase connection
var firebase
var database

var warmedup = false

app.get('/_ah/warmup', (req, res) => {
  // Handle your warmup logic. Initiate db connection, etc.
  warmup()
  res.send()
})

function warmup () {
  if (warmedup) {
    return
  }
  firebase = require('firebase/app')
  require('firebase/auth')
  require('firebase/database')

  const firebaseConfig = require('./../firebaseauth.json')

  firebase.initializeApp(firebaseConfig)
  database = firebase.database()
  warmedup = true

  require('./firebaseListeners')(io, database)

  require('./game')(io, database)
}

http.listen(PORT, () => {
  console.log('Listening on: ' + PORT)

  if (!warmedup) {
    warmup()
  }

  // game.clearInactiveUsers()
  console.timeEnd('Started server in')
  if (process.argv.includes('test')) {
    process.exit(0)
  }
})

app.get('/*', function (request, response) {
  console.log(request.path)
  response.send('<html lang="uk"><script>window.location.href="https://cards.adamhodgkinson.dev?apiuri=" + window.location.hostname</script></html>')
})

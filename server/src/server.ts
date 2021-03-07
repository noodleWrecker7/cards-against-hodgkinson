import { start } from '@google-cloud/debug-agent'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import express, { Request, Response } from 'express'

import { Server } from 'http'
import { Server as Io } from 'socket.io'

import firebase from 'firebase/app'

import game from './game'

console.log('Server Starting')
console.time('Started server in')

// Setting origin header
let originHeader: string
if (process.env.buildmode !== 'production') {
  console.log('Currently running on beta branch')
  originHeader = '*'
} else {
  console.log('Current Build: #' + process.env.GAE_VERSION)
  start({ serviceContext: { enableCanary: false } })
  originHeader = 'https://cards.adamhodgkinson.dev'
}

// Loading cards

// Starting request handler
const PORT = process.env.PORT || 1984
const app = express()
const http = new Server(app)
const ioSrv = new Io(http, {
  cors: {
    origin: originHeader,
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
})

// Starting firebase connection
let warmedup = false

app.get('/_ah/warmup', (req: Request, res: Response) => {
  // Handle your warmup logic. Initiate db connection, etc.
  warmup()
  res.send()
})

function warmup() {
  if (warmedup) {
    return
  }

  console.time('Warmed up in ')
  require('firebase/auth')
  require('firebase/database')

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const firebaseConfig = require('../firebaseauth.json')

  firebase.initializeApp(firebaseConfig)
  const database = firebase.database()
  game(ioSrv, database)
  warmedup = true
  console.log('hello')
  console.timeEnd('Warmed up in ')
}

app.get('/_ah/start', (req: Request, res: Response) => {
  // Handle your warmup logic. Initiate db connection, etc.
  if (!warmedup) {
    warmup()
  }
  res.send()
})

http.listen(PORT, () => {
  console.log('Listening on: ' + PORT)

  // game.clearInactiveUsers()
  console.timeEnd('Started server in')
  if (process.argv.includes('test')) {
    process.exit(0)
  }
  if (process.env.buildmode !== 'production') {
    warmup()
  }
})

app.get('/*', function (request: Request, response: Response) {
  console.log(request.path)
  response.send(
    '<html lang="uk"><script>window.location.href="https://cards.adamhodgkinson.dev?apiuri=" + window.location.hostname</script></html>'
  )
})

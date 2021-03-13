import 'source-map-support/register'
import { start } from '@google-cloud/debug-agent'

import { logger } from '@noodlewrecker7/logger'
import Logger = logger.Logger
// global.Logger = Logger

Logger.setLevel(Logger.Levels.TRACE)

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import express, { Request, Response } from 'express'

import { Server } from 'http'
import { Server as Io } from 'socket.io'

import firebase from 'firebase/app'

import game from './game'

Logger.info('Server Starting')
Logger.time('Started server in')

// Setting origin header
let originHeader: string
if (process.env.buildmode !== 'production') {
  Logger.info('Currently running on beta branch')
  originHeader = '*'
  Logger.setLevel(Logger.Levels.TRACE)
} else {
  Logger.info('Current Build: #' + process.env.GAE_VERSION)
  start({ serviceContext: { enableCanary: false } })
  originHeader = 'https://cards.adamhodgkinson.dev'
  Logger.setLevel(Logger.Levels.WARN)
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

  Logger.time('Warmed up in ')
  require('firebase/auth')
  require('firebase/database')

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const firebaseConfig = require('../firebaseauth.json')

  firebase.initializeApp(firebaseConfig)
  const database = firebase.database()
  game(ioSrv, database)
  warmedup = true
  Logger.timeEnd('Warmed up in ')
}

app.get('/_ah/start', (req: Request, res: Response) => {
  // Handle your warmup logic. Initiate db connection, etc.
  if (!warmedup) {
    warmup()
  }
  res.send()
})

http.listen(PORT, () => {
  Logger.info('Listening on: ' + PORT)

  // game.clearInactiveUsers()
  Logger.timeEnd('Started server in')
  if (process.argv.includes('test')) {
    process.exit(0)
  }
  if (process.env.buildmode !== 'production') {
    warmup()
  }
})

app.get('/*', function (request: Request, response: Response) {
  const reqPath = request.path
  Logger.debug({ reqPath })
  response.send(
    '<html lang="uk"><script>window.location.href="https://cards.adamhodgkinson.dev?apiuri=" + window.location.hostname</script></html>'
  )
})

// Various useful funcs
import firebase from 'firebase'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import blackCards from '../../../data/black.json'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import whiteCards from '../../../data/white.json'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { Socket } from 'socket.io'
import { cardType, Utils } from '../../../types'
import { logger } from '@noodlewrecker7/logger'
import Logger = logger.Logger

type Database = firebase.database.Database

export default (database: Database): Utils => {
  return new _Utils(database)
}

class _Utils implements Utils {
  blackCardsLength: number
  whiteCardsLength: number
  database: Database

  RATE_LIMITER = new RateLimiterMemory({
    points: 15,
    duration: 1, // per sec
  })

  constructor(database: Database) {
    this.database = database
    Logger.time('Loaded black cards in')
    this.blackCardsLength = blackCards.length
    Logger.timeEnd('Loaded black cards in')

    Logger.time('Loaded white cards in')
    this.whiteCardsLength = whiteCards.length
    Logger.timeEnd('Loaded white cards in')
  }

  getBlackCard(): cardType {
    const r = Math.floor(Math.random() * this.blackCardsLength)
    return blackCards[r]
  }

  // eslint-disable-next-line no-unused-vars
  getWhiteCard(): cardType {
    const r = Math.floor(Math.random() * this.whiteCardsLength)
    return whiteCards[r]
  }

  generateID(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890-'
    let str = new Date().toTimeString().substr(0, 8).replace(/:/g, '')
    for (let i = 0; i < 4; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return str
  }

  escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/£/g, '&pound;')
  }

  handleCall(uid: string, socket: Socket): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.RATE_LIMITER.consume(socket.handshake.auth.token)
        .then(() => {
          this.authenticateMessage(uid, socket.handshake.auth.token)
            .then(() => {
              resolve(true)
            })
            .catch((err: Error) => {
              if (err.message === 'secretnotmatch') {
                socket.emit('secretnotmatch')
              } else if (err.message === 'usernotfound') {
                socket.emit('returningsessioninvalid')
              }
            })
        })
        .catch((err: Error) => {
          Logger.error(err.message)
          Logger.debug(err.stack)
          Logger.trace('Err in handle call')
          reject(new Error('rate limit'))
        })
    })
  }

  authenticateMessage(uid: string, secret: string): Promise<boolean> {
    this.database.ref('users/' + uid + '/lastSeen').set(Date.now())
    return new Promise((resolve, reject) => {
      this.database
        .ref('users/' + uid + '/secret')
        .once('value', (snap) => {
          if (!snap.exists()) {
            reject(new Error('usernotfound'))
          }
          if (secret === snap.val()) {
            resolve(true)
          } else {
            reject(new Error('secretnotmatch'))
          }
        })
        .catch((reason) => {
          Logger.error(reason.message)
          reject(new Error('usernotfound'))
        })
    })
  }
}

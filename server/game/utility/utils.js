module.exports = (database) => {
  console.time('Loaded black cards in')
  const blackCards = require('../../../data/black.json')
  const blackCardsLength = blackCards.length
  console.timeEnd('Loaded black cards in')

  console.time('Loaded white cards in')
  const whiteCards = require('../../../data/white.json')
  const whiteCardsLength = whiteCards.length
  console.timeEnd('Loaded white cards in')

  const { RateLimiterMemory } = require('rate-limiter-flexible')
  const RATE_LIMITER = new RateLimiterMemory({
    points: 15,
    duration: 1 // per sec
  })

  return {
    getBlackCard () {
      const r = Math.floor(Math.random() * blackCardsLength)
      return blackCards[r]
    },

    // eslint-disable-next-line no-unused-vars
    getWhiteCard () {
      const r = Math.floor(Math.random() * whiteCardsLength)
      return whiteCards[r]
    },
    generateID () {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890-'
      let str = (new Date()).toTimeString().substr(0, 8).replace(/:/g, '')
      for (let i = 0; i < 4; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return str
    },
    escapeHtml (unsafe) {
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/£/g, '&pound;')
    },

    handleCall (uid, socket) {
      return new Promise((resolve, reject) => {
        RATE_LIMITER.consume(socket.handshake.auth.token).then(function () {
          authenticateMessage(uid, socket.handshake.auth.token, database).then(() => {
            resolve()
          }).catch((err) => {
            if (err.message === 'secretnotmatch') {
              socket.emit('secretnotmatch')
            } else if (err.message === 'usernotfound') {
              socket.emit('returningsessioninvalid')
            }
          })
        }).catch((err) => {
          console.log(err)
          console.log(err.stack)
          console.trace()
          reject(new Error('rate limit'))
        })
      })
    }
  }
}

function authenticateMessage (uid, secret, database) {
  database.ref('users/' + uid + '/lastSeen').set(Date.now())
  return new Promise((resolve, reject) => {
    database.ref('users/' + uid + '/secret').once('value', (snap) => {
      if (!snap.exists()) {
        reject(new Error('usernotfound'))
      }
      if (secret === snap.val()) {
        resolve()
      } else {
        reject(new Error('secretnotmatch'))
      }
    }).catch((reason) => {
      console.log(reason)
      reject(new Error('usernotfound'))
    })
  })
}

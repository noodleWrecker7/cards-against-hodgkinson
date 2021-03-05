const expect = require('chai').expect

describe('Server side testing', function () {
  var database, getData, setData, utils, emitters, funcs, cb, data
  before('Load', (done) => {
    const firebase = require('firebase/app')
    require('firebase/auth')
    require('firebase/database')

    const firebaseConfig = require('../firebaseauth.json')
    firebaseConfig.databaseURL = 'https://testcardsagainsthodgkinson.europe-west1.firebasedatabase.app/'

    firebase.initializeApp(firebaseConfig)
    database = firebase.database()

    const gameRoot = '../out/game/'
    getData = require(gameRoot + 'utility/getData')(database)
    setData = require(gameRoot + 'utility/setData')(database)
    utils = require(gameRoot + 'utility/utils')(database)
    emitters = require(gameRoot + 'utility/clientEmitters')(database, getData)
    funcs = require(gameRoot + 'gameFuncs')(database, utils, getData, setData, emitters)
    cb = require(gameRoot + 'clientCBRequests')(getData, utils)

    data = require('./testdb.json')
    expect(data).to.be.a('Object')

    database.ref().set(data).then(() => {
      done()
    })
  })

  after(done => {
    database.goOffline()
    done()
  })

  it('Should initialise', () => {
    expect(funcs).to.be.a('Object')
    expect(database).to.be.a('Object')
  })

  describe('Utils.js', () => {
    it('Escape HTML', () => {
      expect(utils.escapeHtml('abcd123!"£$%^&*()')).to.equal('abcd123!&quot;&pound;$%^&amp;*()')
    })

    it('Should return a valid black card', () => {
      const card = utils.getBlackCard()
      expect(card).to.have.property('text').to.be.a('string')
      expect(card).to.have.property('pack').to.be.a('string')
      expect(card).to.have.property('rule').to.be.a('number')
    })
    it('Should return a valid white card', () => {
      const card = utils.getWhiteCard()
      expect(card).to.have.property('text').to.be.a('string')
      expect(card).to.have.property('pack').to.be.a('string')
    })
  })

  describe('Socket testing', () => {
    const io = require('socket.io-client')
    const app = require('express')()
    const http = require('http')
    const ioBack = require('socket.io')

    let socketClient
    let httpServer
    let httpServerAddr
    let ioServer

    // Setup WS & HTTP server
    before((done) => {
      httpServer = http.Server(app)

      ioServer = ioBack(httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          allowedHeaders: ['my-custom-header'],
          credentials: true,
          allowEIO3: true
        }
      })
      const PORT = process.env.PORT || 1984
      const listened = httpServer.listen(PORT, function () {
        done()
      })
      httpServerAddr = listened.address()
    })

    // Cleanup WS & HTTP server
    after((done) => {
      ioServer.close()
      httpServer.close()

      done()
    })

    beforeEach((done) => {
      // Setup
      socketClient = io.connect(`http://localhost:${httpServerAddr.port}`, {
        'reconnection delay': 1000,
        'reopen delay': 1000,
        'force new connection': true,
        transports: ['websocket'],
        auth: {
          token: 'testtoken'
        }
      })
      socketClient.on('connect', () => {
        done()
      })
    })

    // Run after each test
    afterEach((done) => {
      // Cleanup
      if (socketClient.connected) {
        socketClient.disconnect()
      }
      done()
    })

    it('Should communicate', (done) => {
      ioServer.emit('test', 'Hello World!')
      socketClient.once('test', (message) => {
        expect(message).to.equal('Hello World!')
        done()
      })
    })

    before('Should load socket listeners', (done) => {
      require('../out/game/init/socketListeners')(ioServer, funcs, utils.handleCall, cb)
      done()
    })
    // eslint-disable-next-line no-unused-vars
    it('Should apply for username', (done) => {
      socketClient.once('usernameaccepted', (data) => {
        expect(data).to.have.property('uid').with.length(13)
        expect(data).to.have.property('secret').with.length(13)
        done()
      })
      socketClient.emit('applyforusername', 'noodle')
    })

    describe('Returning Session', () => {
      it('Should accept returning session', (done) => {
        socketClient.once('returningsessionaccepted', () => {
          done()
        })
        socketClient.emit('returningsession', { uid: 'UID1234567890' })
      })

      it('Should reject bad secret', done => {
        socketClient.once('secretnotmatch', () => {
          done()
        })

        socketClient.emit('returningsession', { uid: 'UID1234567892' })
      })

      it('Should reject invalid session', done => {
        socketClient.once('returningsessioninvalid', () => {
          done()
        })
        socketClient.emit('returningsession', { uid: 'UIDxxxxxxxxxx' })
      })
    })
  })
  describe('Game funcs', () => {
    describe('#nextCzar()', () => {
      it('Should pick next czar', done => {
        setData.czar('testCzar', 'a')
        funcs.nextCzar('czarTest').then((result) => {
          expect(result).to.equal('b')
          done()
        })
      })
      it('Should loop czar', done => {
        setData.czar('testCzar', 'b')
        funcs.nextCzar('czarTest').then((result) => {
          expect(result).to.equal('a')
          done()
        })
      })
    })
    describe('#isAllCardsPlayed()', () => {
      it('Should resolve false', done => {
        funcs.isAllCardsPlayed('isAllCardsPlayedTest').then((res) => {
          expect(res).to.equal(false)
          done()
        })
      })
      it('Should resolve true', done => {
        database.ref('gameStates/isAllCardsPlayedTest/playedCards').set({
          UID1: [{
            pack: 'Main Deck',
            text: 'Friendly fire.'
          }],
          UID2: [{
            pack: 'Main Deck',
            text: 'Friendly fire.'
          }]
        }).then(() => {
          funcs.isAllCardsPlayed('isAllCardsPlayedTest').then((res) => {
            expect(res).to.equal(true)
            done()
          })
        })
      })
      it('Should reject', done => {
        database.ref('gameStates/isAllCardsPlayedTest/playedCards').set({
          UID1: [{
            pack: 'Main Deck',
            text: 'Friendly fire.'
          }],
          UID2: [{
            pack: 'Main Deck',
            text: 'Friendly fire.'
          }],
          UID3: [{
            pack: 'Main Deck',
            text: 'Friendly fire.'
          }]
        }).then(() => {
          funcs.isAllCardsPlayed('isAllCardsPlayedTest').then(() => {
          }).catch(err => {
            expect(err).to.be.a('Error')
            done()
          })
        })
      })
    })
  })
})
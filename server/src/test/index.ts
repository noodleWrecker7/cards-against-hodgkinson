// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { expect } from 'chai'

import firebase from 'firebase/app'

import game from '../game/utility/getData'

import game0 from '../game/utility/setData'

import game01 from '../game/utility/utils'

import game012 from '../game/utility/clientEmitters'

import game0123 from '../game/gameFuncs'

import game01234 from '../game/clientCBRequests'
import Database = firebase.database.Database
import { GameFuncs, GetData, SetData, userObj, Utils } from '../../types'

import express from 'express'

import http from 'http'

import { Server as ioBack } from 'socket.io'

import { io, Socket } from 'socket.io-client'

import game012345 from '../game/init/socketListeners'

describe('Server side testing', function () {
  let database: Database,
    getData: GetData,
    setData: SetData,
    utils: Utils,
    emitters: any,
    funcs: GameFuncs,
    cb: any,
    data
  before('Load', (done) => {
    require('firebase/auth')
    require('firebase/database')

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const firebaseConfig = require('../../firebaseauth.json')
    firebaseConfig.databaseURL =
      'https://testcardsagainsthodgkinson.europe-west1.firebasedatabase.app/'

    firebase.initializeApp(firebaseConfig)
    database = firebase.database()

    getData = game(database)
    setData = game0(database)
    utils = game01(database)
    emitters = game012(database, getData)
    funcs = game0123(database, utils, getData, setData, emitters)
    cb = game01234(getData, utils)

    data = require('../../data/testdb.json')
    expect(data).to.be.a('Object')

    database
      .ref()
      .set(data)
      .then(() => {
        done()
      })
  })

  after((done) => {
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
      console.log(card)
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
    const app = express()
    // const ioBack = require('socket.io')

    let socketClient: Socket
    let httpServer: number | http.Server | undefined
    let httpServerAddr: any
    let ioServer: ioBack

    // Setup WS & HTTP server
    before((done) => {
      httpServer = new http.Server(app)

      ioServer = new ioBack(httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          allowedHeaders: ['my-custom-header'],
          credentials: true,
        },
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      httpServer.close()

      done()
    })

    beforeEach((done) => {
      // Setup
      socketClient = io(`http://localhost:${httpServerAddr.port}`, {
        transports: ['websocket'],
        auth: {
          token: 'testtoken',
        },
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
      socketClient.once('test', (message: string) => {
        expect(message).to.equal('Hello World!')
        done()
      })
    })

    before('Should load socket listeners', (done) => {
      game012345(ioServer, funcs, utils, cb, emitters)
      done()
    })
    // eslint-disable-next-line no-unused-vars
    it('Should apply for username', (done) => {
      socketClient.once('usernameaccepted', (data: userObj) => {
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

      it('Should reject bad secret', (done) => {
        socketClient.once('secretnotmatch', () => {
          done()
        })

        socketClient.emit('returningsession', { uid: 'UID1234567892' })
      })

      it('Should reject invalid session', (done) => {
        socketClient.once('returningsessioninvalid', () => {
          done()
        })
        socketClient.emit('returningsession', { uid: 'UIDxxxxxxxxxx' })
      })
    })
  })
  describe('Game funcs', () => {
    describe('#nextCzar()', () => {
      it('Should pick next czar', (done) => {
        setData.czar('testCzar', 'a')
        funcs.nextCzar('czarTest').then((result) => {
          expect(result).to.equal('b')
          done()
        })
      })
      it('Should loop czar', (done) => {
        setData.czar('testCzar', 'b')
        funcs.nextCzar('czarTest').then((result) => {
          expect(result).to.equal('a')
          done()
        })
      })
    })
    describe('#isAllCardsPlayed()', () => {
      it('Should resolve false', (done) => {
        funcs.isAllCardsPlayed('isAllCardsPlayedTest').then((res) => {
          expect(res).to.equal(false)
          done()
        })
      })
      it('Should resolve true', (done) => {
        database
          .ref('gameStates/isAllCardsPlayedTest/playedCards')
          .set({
            UID1: [
              {
                pack: 'Main Deck',
                text: 'Friendly fire.',
              },
            ],
          })
          .then(() => {
            funcs.isAllCardsPlayed('isAllCardsPlayedTest').then((res) => {
              expect(res).to.equal(true)
              done()
            })
          })
      })
      it('Should reject', (done) => {
        database
          .ref('gameStates/isAllCardsPlayedTest/playedCards')
          .set({
            UID1: [
              {
                pack: 'Main Deck',
                text: 'Friendly fire.',
              },
            ],
            UID2: [
              {
                pack: 'Main Deck',
                text: 'Friendly fire.',
              },
            ],
            UID3: [
              {
                pack: 'Main Deck',
                text: 'Friendly fire.',
              },
            ],
          })
          .then(() => {
            funcs.isAllCardsPlayed('isAllCardsPlayedTest').catch((err) => {
              expect(err).to.be.a('Error')
              done()
            })
          })
      })
    })

    describe('#removeLosingCards()', () => {
      beforeEach((done) => {
        database
          .ref('gameStates/removeCardsTest/playedCards')
          .set({
            a: [
              {
                pack: 'Main Deck',
                text: 'card a',
              },
            ],
            b: [
              {
                pack: 'Main Deck',
                text: 'card b',
              },
            ],
            c: [
              {
                pack: 'Main Deck',
                text: 'card c',
              },
            ],
          })
          .then(() => {
            done()
          })
      })
      it('Should leave card a', (done) => {
        funcs.removeLosingCards('removeCardsTest', 'a').then((success) => {
          getData.playedCards('removeCardsTest').then((data) => {
            expect(data).to.have.property('a')
            expect(data.a[0]).to.have.property('text')
            done()
          })
        })
      })
      it('Should leave card b', (done) => {
        funcs.removeLosingCards('removeCardsTest', 'b').then(() => {
          getData.playedCards('removeCardsTest').then((data) => {
            expect(data).to.have.property('b')
            done()
          })
        })
      })
      it('Should leave card c', (done) => {
        funcs.removeLosingCards('removeCardsTest', 'c').then(() => {
          getData.playedCards('removeCardsTest').then((data) => {
            expect(data).to.have.property('c')
            done()
          })
        })
      })
    })
  })
})

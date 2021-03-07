// All socket.ons go here
import { Server } from 'socket.io'
import { GameFuncs, Utils, sockCB } from '../../../types'

export default (io: Server, funcs: GameFuncs, utils: Utils, cb: any) => {
  io.on('connection', function (socket) {
    // handle sockets
    socket.emit('welcometoserver', process.env.GAE_VERSION ? process.env.GAE_VERSION : 'Beta')

    //
    socket.on('applyforusername', function (name: string) {
      // console.log('apply for username')
      funcs.applyforusername(name, socket)
    })

    socket.on('returningsession', (data: { uid: string }) => {
      // console.log('returning session')
      utils.handleCall(data.uid, socket).then(() => {
        funcs.returningsession(data.uid, socket)
      })
    })

    socket.on(
      'creategame',
      function (data: {
        uid: string
        title: string
        maxPlayers: number
        maxRounds: number
        isPrivate: boolean
        ownerName: string
      }) {
        // console.log('creategame')
        utils.handleCall(data.uid, socket).then(() => {
          funcs.attemptCreateGame(
            data.title,
            data.maxPlayers,
            data.uid,
            data.maxRounds,
            data.isPrivate,
            data.ownerName,
            socket
          )
        })
      }
    )

    socket.on('arriveatgamepage', function (data: { uid: string; gid: string }) {
      // console.log('arrivegamepage')
      utils.handleCall(data.uid, socket).then(() => {
        funcs.arriveAtGamePage(data.gid, data.uid, socket)
      })
    })

    socket.on('startgame', function (data: { uid: string; gid: string }) {
      // console.log('start game')
      utils.handleCall(data.uid, socket).then(() => {
        funcs.startGame(data.uid, data.gid, socket)
      })
    })

    socket.on('logout', async function (data: { uid: string }) {
      // console.log('logout')
      utils.handleCall(data.uid, socket).then(() => {
        funcs.logout(data.uid, socket)
      })
    })

    socket.on(
      'selectcards',
      function (data: { uid: string; gid: string; cards: string[] }, callback: sockCB) {
        // console.log('selectcards')
        utils
          .handleCall(data.uid, socket)
          .then(() => {
            funcs.selectCards(data.uid, data.gid, data.cards, callback)
          })
          .catch((err) => {
            if (err.message === 'rate limit') {
              callback({ error: 'rate limit' })
            }
          })
      }
    )

    socket.on('czarpickcard', function (data: { uid: string; gid: string; winner: string }) {
      utils.handleCall(data.uid, socket).then(() => {
        funcs.czarPicksCard(data.gid, data.uid, data.winner, socket)
      })
    })

    //
    socket.on('requestwhitecards', function (data: { uid: string }, callback: sockCB) {
      // console.log('reqwhitecards')
      cb.requestwhitecards(data.uid, data.uid, callback, socket)
    })

    socket.on('requestlobbies', function (data: { uid: string }, callback: sockCB) {
      // console.log('reqlobbies')
      cb.requestlobbies(data.uid, callback, socket)
    })
  })
}

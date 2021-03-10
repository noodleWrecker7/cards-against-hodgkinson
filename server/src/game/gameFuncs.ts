// Server-side logic, generally doing things to the game and users

import {Socket} from 'socket.io'
import firebase from 'firebase'
import {
  cardType,
  GameFuncs,
  gamePlayerObject,
  gameStateType,
  GetData,
  SetData,
  sockCB,
  updateType,
  userObj,
  userWhiteCardsType,
  Utils,
} from '../../types'

import {gameplayState} from '../gameplayStateEnum'

type Database = firebase.database.Database

const MAX_WHITE_CARDS = 7
export default (
  database: Database,
  utils: Utils,
  getData: GetData,
  setData: SetData,
  emit: any
): GameFuncs => {
  return new _GameFuncs(database, utils, getData, setData, emit)
}

class _GameFuncs implements GameFuncs {
  // Socket.io conns
  // Spaghetti starts here
  database: Database
  utils: Utils
  getData: GetData
  setData: SetData
  emit: any

  constructor(database: Database, utils: Utils, getData: GetData, setData: SetData, emit: any) {
    this.database = database
    this.utils = utils
    this.getData = getData
    this.setData = setData
    this.emit = emit
  }

  startGame(uid: string, gid: string, socket: Socket) {
    this.getData
      .gameplayInfo(gid)
      .then((game: gameStateType['gameplayInfo']) => {
        if (!(game.creatorUID === uid)) {
          socket.emit('notauthorisedtoaction')
        } else if (game.state === gameplayState.NOT_STARTED) {
          this.progressGame(gid)
        }
      })
      .catch((err: Error) => {
        console.log(err)
        console.log('gamenotfound')
        socket.emit('gamenotfound')
      })
  }

  // todo might be worth updating white cards on a per player basis when they play their cards
  dealCards(gid: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('dealing')
      this.getData
        .whiteCardsData(gid)
        .then((whites: { [uid: string]: userWhiteCardsType }) => {
          this.getData
            .gamePlayers(gid)
            .then((players: { [uid: string]: gamePlayerObject }) => {
              const keys = Object.keys(players)
              const updates: updateType = {}
              for (let i = 0; i < keys.length; i++) {
                // for each user
                console.log('handling user')
                let len
                try {
                  len = Object.keys(whites[keys[i]].inventory).length
                } catch (e) {
                  len = 0
                }
                const cardsToAdd = MAX_WHITE_CARDS - len // how many cards need adding
                console.log({cardsToAdd})

                for (let j = 0; j < cardsToAdd; j++) {
                  const ref = 'gameStates/' + gid + '/whiteCardsData/' + keys[i] + '/inventory/'
                  updates[ref + this.database.ref(ref).push().key] = this.utils.getWhiteCard()
                }
                updates['gameStates/' + gid + '/players/' + keys[i] + '/doing'] = 'Playing'
              }
              updates['gameStates/' + gid + '/gameplayInfo/blackCard'] = this.utils.getBlackCard()
              this.database.ref().update(updates) // does all updates at once
              resolve()
            })
            .catch((err: Error) => {
              console.log(err)
            })
        })
        .catch((reason: Error) => {
          reject(reason)
        })
    })
  }

  progressGame(gid: string) {
    this.getData.gameplayState(gid).then((state: gameplayState) => {
      const updates: updateType = {}
      switch (state) {
        case gameplayState.NOT_STARTED:
          updates['gameStates/' + gid + '/gameplayInfo/state'] = gameplayState.PLAYERS_PICKING
          updates['gameStates/' + gid + '/gameplayInfo/round'] = 1
          this.dealCards(gid)
          this.nextCzar(gid).then((czar) => {
            this.setData.gamePlayerDoing(gid, czar, 'Czar')
          })
          break
        case gameplayState.PLAYERS_PICKING:
          updates['gameStates/' + gid + '/gameplayInfo/state'] = gameplayState.PLAYERS_VOTING
          break
        case gameplayState.PLAYERS_VOTING:
          updates['gameStates/' + gid + '/gameplayInfo/state'] = gameplayState.TRANSITION
          // todo timer
          setTimeout(() => {
            // gotta be arrow function to get this context
            this.progressGame(gid)
          }, 5000)
          break

        case gameplayState.TRANSITION:
          updates['gameStates/' + gid + '/gameplayInfo/state'] = gameplayState.PLAYERS_PICKING
          this.dealCards(gid).then(() => {
            this.nextCzar(gid).then((czar) => {
              this.setData.gamePlayerDoing(gid, czar, 'Czar')
            })
          })
          this.getData.roundNum(gid).then((round) => {
            this.setData.roundNum(gid, round + 1)
          })
          break
      }
      this.database.ref().update(updates)
    })
  }

  nextCzar(gid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.getData.czar(gid).then((czar: string) => {
        this.database
          .ref('gameStates/' + gid + '/players')
          .orderByKey()
          .startAfter(czar)
          .limitToFirst(1)
          .once('value')
          .then((snap) => {
            if (snap.exists()) {
              const id = Object.keys(snap.val())[0]
              this.setData.czar(gid, id)
              resolve(id)
            } else {
              // if czar is at end of list wrap around
              this.database
                .ref('gameStates/' + gid + '/players/')
                .orderByKey()
                .limitToFirst(1)
                .once('value')
                .then((snap2) => {
                  const id = Object.keys(snap2.val())[0]
                  this.setData.czar(gid, id)
                  resolve(id)
                })
            }
          })
      })
    })
  }

  logout(uid: string, socket?: Socket) {
    this.getData.userState(uid).then((state: string) => {
      if (state.includes('GID')) {
        console.log('logged out user has a game')
        const gid = state.substring(state.indexOf('GID'), 13)
        this.removePlayerFromGame(uid, gid, socket, '/')
      }
    })
    this.database.ref('users/' + uid).remove()
  }

  removePlayerFromGame(uid: string, gid: string, socket?: Socket, newstate = '/lobby') {
    if (socket) {
      socket.leave(gid)
    }
    this.setData.userState(uid, newstate)
    // todo implement player removing
  }

  // todo add spectator functionality
  arriveAtGamePage(gid: string, uid: string, socket: Socket) {
    this.getData
      .game(gid)
      .then((game: gameStateType) => {
        this.getData
          .userState(uid)
          .then((userState: string) => {
            socket.join(gid) // join to game channel for socket emissions

            if (game.whiteCardsData && game.whiteCardsData[uid]) {
              socket.emit('sendplayerwhitecards', game.whiteCardsData[uid].inventory)
            }

            if (
              userState.includes('game') &&
              userState.substr(userState.indexOf('GID'), 13) !== gid
            ) {
              // if already in a game
              this.removePlayerFromGame(uid, gid, socket)
            }

            this.joinPlayerToGame(uid, gid).then(() => {
              this.emit.state(socket, uid)
              this.emit.gameplayInfo(socket, gid)
              this.emit.playedCards(socket, gid)
            })
            // Err handling
          })
          .catch(() => {
            socket.emit('returningsessioninvalid')
          })
      })
      .catch(() => {
        socket.emit('gamenotfound')
        this.removePlayerFromGame(uid, gid, socket)
      })
  }

  joinPlayerToGame(uid: string, gid: string) {
    return new Promise((resolve, reject) => {
      console.log('join player to game')
      const updates: updateType = {}

      this.getData.username(uid).then((username: string) => {
        updates['gameStates/' + gid + '/players/' + uid] = {
          name: username,
          points: 0,
          hasPlayed: false,
        }

        updates['users/' + uid + '/state'] = '/game/' + gid

        this.database
          .ref()
          .update(updates)
          .then(() => {
            resolve(true)
          })
      })
    })
  }

  attemptCreateGame(
    title: string,
    maxPlayers: number,
    uid: string,
    maxRounds: number,
    isPrivate: boolean,
    ownerName: string,
    socket: Socket
  ) {
    console.log('requested to make game')
    console.log()
    const id = this.createGame(title, maxPlayers, uid, maxRounds, isPrivate, ownerName)
    socket.emit('gamecreatedsuccess', id)
  }

  createGame(
    name: string,
    maxPlayer: number,
    owner: string,
    maxRounds: number,
    isPrivate: boolean,
    ownerName: string
  ) {
    const id = 'GID' + this.utils.generateID()
    const display = {
      name: name,
      ownerName: ownerName,
      playerCount: 1,
      maxPlayers: maxPlayer,
      isPrivate: isPrivate,
    }
    const gameState: gameStateType = {
      name: name,
      spectators: {},
      whiteCardsData: {
        [owner]: {
          inventory: {},
          played: false,
        },
      },
      gameplayInfo: {
        blackCard: {text: '', pack: '', rule: 0},
        round: 0,
        maxRounds: maxRounds,
        creatorUID: owner,
        state: gameplayState.NOT_STARTED,
        czar: owner,
      },
      playedCards: {},
      players: {},
    }
    this.database.ref('gameDisplayInfo/' + id).set(display)
    this.database.ref('gameStates/' + id).set(gameState)
    return id
  }

  returningsession(uid: string, socket: Socket) {
    this.database.ref('users/' + uid).once('value', (snap) => {
      if (!snap.exists()) {
        socket.emit('returningsessioninvalid')
      } else {
        const val = snap.val()
        socket.emit('returningsessionaccepted', {name: val.name, state: val.state})
        if (val.state.includes('GID')) {
          const gid = val.state.substr(val.state.indexOf('GID'), 13)
          socket.join(gid)
        }
      }
    })
  }

  applyforusername(data: string, socket: Socket) {
    data = this.utils.escapeHtml(data)
    if (socket === null) {
      return
    }
    const uid = 'UID' + this.utils.generateID()
    const secret = 'SEC' + this.utils.generateID()
    const playerObj: userObj = {
      UID: uid,
      name: data,
      secret: secret,
      state: '/lobby', // current position in the flow eg game lobby etc
      lastseen: Date.now(),
    }
    this.database
      .ref('users/' + uid)
      .set(playerObj)
      .then(() => {
        socket.emit('usernameaccepted', {uid: uid, name: data, state: '/lobby', secret: secret})
      })
  }

  clearInactiveUsers(_logout: (uid: string, socket?: Socket) => void) {
    // 1800000
    const cutoff = Date.now() - 1800000 // 30 mins ago
    this.database
      .ref('users')
      .orderByChild('lastSeen')
      .endBefore(cutoff)
      .once('value')
      .then((snap) => {
        _logout(<string>snap.key)
      })
  }

  selectCards(uid: string, gid: string, cards: string[], callback: sockCB) {
    console.log(cards)
    if (!cards) {
      callback({error: 'none sent'})
      return
    }

    Promise.all([this.getData.gameplayInfo(gid), this.getData.usersWhiteCards(uid, gid)])
      .then((values) => {
        const gameInfo = values[0]
        const userCards = values[1]
        if (!gameInfo.blackCard.rule) {
          return
        }
        if (cards.length > gameInfo.blackCard.rule) {
          callback({error: 'too many'})
          return
        }
        if (userCards.played) {
          callback({error: 'already played'})
          return
        }
        if (gameInfo.czar === uid) {
          callback({error: 'is czar'})
          return
        }
        const keys = Object.keys(userCards.inventory)
        const valid = cards.every((v) => keys.includes(v)) // checks keys provided are actually part of inventory
        if (!valid) {
          callback({error: 'not exist'})
          return
        }

        this.playCards(gid, uid, cards, userCards).then((res) => {
          if (res) {
            callback({data: true})
          }
        })

        //
      })
      .catch((err) => {
        console.log(err)
        callback({error: 'unknown'})
      })
  }

  stripPlayerList(gid: string): Promise<void> {
    return new Promise<void>((resolve) => {
      Promise.all([this.getData.whiteCardsData(gid), this.getData.gamePlayers(gid)]).then(
        (values) => {
          const whiteCards = Object.keys(values[0])
          const players = Object.keys(values[1])
          const updates: updateType = {}
          for (let i = 0; i < whiteCards.length; i++) {
            if (!players.includes(whiteCards[i])) {
              updates['gameStates/' + gid + '/whiteCardsData/' + whiteCards[i]] = null
            }
          }
          resolve()
        }
      )
    })
  }

  playCards(
    gid: string,
    uid: string,
    cards: string[],
    userCards: userWhiteCardsType
  ): Promise<boolean> {
    const updates: updateType = {}
    return new Promise((resolve, reject) => {
      this.stripPlayerList(gid).then(() => {
        const cardObjs: cardType[] = []
        for (let i = 0; i < cards.length; i++) {
          cardObjs.push(userCards.inventory[cards[i]])
          updates['gameStates/' + gid + '/whiteCardsData/' + uid + '/inventory/' + cards[i]] = null
        }
        updates['gameStates/' + gid + '/whiteCardsData/' + uid + '/played'] = true
        updates['gameStates/' + gid + '/playedCards/' + uid] = cardObjs
        updates['gameStates/' + gid + '/players/' + uid + '/doing'] = 'Played'
        this.database
          .ref()
          .update(updates)
          .then(() => {
            console.log('Successfully played card' + {gid, uid})
            resolve(true)

            this.isAllCardsPlayed(gid)
              .then((result) => {
                if (result) {
                  this.progressGame(gid) // should go to voting stage
                }
              })
              .catch((err) => {
                console.log(err.message)
              })
          })
      })
    })
  }

  isAllCardsPlayed(gid: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // todo check if last player to play then progress
      Promise.all([this.getData.playedCards(gid), this.getData.whiteCardsData(gid)])
        .then((values) => {
          const playedCards = values[0]
          const whiteCards = values[1]
          const numOfPlayedCards = Object.keys(playedCards).length
          const numOfPlayers = Object.keys(whiteCards).length
          if (!playedCards) {
            resolve(false)
          } else if (numOfPlayedCards === numOfPlayers - 1) {
            // if everyone played
            console.log('All cards played' + {gid})
            resolve(true)
          } else if (numOfPlayedCards < numOfPlayers) {
            resolve(false)
          } else {
            reject(new Error('Error checking if all played'))
          }
        })
        .catch((err) => {
          if (err.message.includes('playedCards') && err.message.includes('Could not get data:')) {
            resolve(false)
          } else {
            reject(new Error('Error getting data on played players'))
          }
        })
    })
  }

  czarPicksCard(gid: string, czaruid: string, winneruid: string, socket: Socket) {
    if (winneruid === '') {
      return
    }
    Promise.all([
      this.getData.whiteCardsData(gid),
      this.getData.gameplayState(gid),
      this.getData.czar(gid),
    ]).then((values) => {
      const players = values[0]
      const state: gameplayState = values[1]
      const czar = values[2]
      if (state !== gameplayState.PLAYERS_VOTING) {
        return
      }
      if (czar !== czaruid) {
        return
      }
      if (!Object.keys(players).includes(winneruid)) {
        return
      }

      this.incrementPlayerScore(gid, winneruid)
      // todo set winning card
      // setData.playedCards(gid, [])
      this.removeLosingCards(gid, winneruid)
      this.progressGame(gid)
    })
  }

  removeLosingCards(gid: string, winner: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getData
        .usersPlayedCards(gid, winner)
        .then((data) => {
          this.setData.playedCards(gid, {[winner]: data}).then(() => {
            resolve(true)
          })
        })
        .catch((err: Error) => {
          console.warn('Failed to remove losing cards at ' + {gid})
          reject(err)
        })
    })
  }

  incrementPlayerScore(gid: string, uid: string) {
    this.getData
      .playerScore(gid, uid)
      .then((score: number) => {
        this.setData.playerScore(gid, uid, score + 1)
      })
      .catch((err) => {
        console.log(err)
        console.log('Player must have left game' + {gid, uid})
      })
  }

  leaveGame(uid: string, gid: string, socket: Socket) {
    const updates: updateType = {}
    updates['gameStates/' + gid + '/players/' + uid] = null
    updates['users/' + uid + '/state'] = '/lobby'

    this.database.ref().update(updates).then(() => {
      this.emit.state(socket, uid)
    })
  }
}

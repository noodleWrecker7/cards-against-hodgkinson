// Server-side logic, generally doing things to the game and users

const MAX_WHITE_CARDS = 7
module.exports = (database, utils, getData, setData, emit) => {
  return { // Socket.io conns

    // Spaghetti starts here

    startGame (uid, gid, socket) {
      getData.gameplayInfo(gid).then((game) => {
        if (!game.creatorUID === uid) {
          socket.emit('notauthorisedtoaction')
        } else if (game.state === 'not started') {
          this.progressGame(gid)
        }
      }).catch((err) => {
        console.log(err)
        console.log('gamenotfound')
        socket.emit('gamenotfound')
      })
    },

    // todo might be worth updating white cards on a per player basis when they play their cards
    dealCards (gid) {
      console.log('dealing')
      getData.whiteCardsData(gid).then((whites) => {
        getData.gamePlayers(gid).then((players) => {
          const keys = Object.keys(players)
          const updates = {}
          for (let i = 0; i < keys.length; i++) { // for each user
            console.log('handling user')
            let len
            try {
              len = Object.keys(whites[keys[i]].inventory).length
            } catch (e) {
              len = 0
            }
            const cardsToAdd = MAX_WHITE_CARDS - len // how many cards need adding
            console.log({ cardsToAdd })

            for (let j = 0; j < cardsToAdd; j++) {
              const ref = 'gameStates/' + gid + '/whiteCardsData/' + keys[i] + '/inventory/'
              updates[ref + database.ref(ref).push().key] = utils.getWhiteCard()
            }
          }
          updates['gameStates/' + gid + '/gameplayInfo/blackCard'] = utils.getBlackCard()
          database.ref().update(updates) // does all updates at once
        }).catch((err) => {
          console.log(err)
        })
      }).catch(reason => {
        return reason
      })
    },

    progressGame (gid) {
      getData.gameplayState(gid).then((state) => {
        const updates = {}
        switch (state) {
          case 'not started':
            updates['gameStates/' + gid + '/gameplayInfo/state'] = 'players picking'
            updates['gameStates/' + gid + '/gameplayInfo/round'] = 1
            this.dealCards(gid)
            break
          case 'players picking':
            updates['gameStates/' + gid + '/gameplayInfo/state'] = 'players voting'
            this.nextCzar(gid).then(czar => {
              setData.gamePlayerDoing(gid, czar, 'Czar')
            })
            break
        }
        database.ref().update(updates)
      })
    },

    nextCzar (gid) {
      return new Promise((resolve, reject) => {
        getData.czar(gid).then((czar) => {
          database.ref('gameStates/' + gid + '/players').orderByKey().startAfter(czar).limitToFirst(1).once('value').then((snap) => {
            if (snap.exists()) {
              const id = Object.keys(snap.val())[0]
              setData.czar(gid, id)
              resolve(id)
            } else { // if czar is at end of list wrap around
              database.ref('gameStates/' + gid + '/players/').orderByKey().limitToFirst(1).once('value').then((snap2) => {
                const id = Object.keys(snap2.val())[0]
                setData.czar(gid, id)
                resolve(id)
              })
            }
          })
        })
      })
    },

    logout (uid, socket) {
      getData.userState(uid).then((state) => {
        if (state.includes('GID')) {
          console.log('logged out user has a game')
          const gid = state.substring(state.indexOf('GID'), 13)
          this.removePlayerFromGame(uid, gid, socket, '/')
        }
      })
      database.ref('users/' + uid).remove()
    },

    removePlayerFromGame (uid, gid, socket, newstate = '/lobby') {
      if (socket) {
        socket.leave(gid)
      }
      setData.userState(uid, newstate)
      // todo implement player removing
    },

    // todo add spectator functionality
    arriveAtGamePage (data, socket) {
      getData.game(data.gid).then((gamesnap) => {
        getData.userState(data.uid).then((usersnap) => {
          socket.join(data.gid) // join to game channel for socket emissions

          if (gamesnap.whiteCardsData && gamesnap.whiteCardsData[data.uid]) {
            socket.emit('sendplayerwhitecards', gamesnap.whiteCardsData[data.uid].inventory)
          }

          if (usersnap.includes('game') && usersnap.substr(usersnap.indexOf('GID'), 13) !== data.gid) { // if already in a game
            this.removePlayerFromGame(data.uid, data.gid, socket)
          }

          this.joinPlayerToGame(data.uid, data.gid).then(() => {
            emit.state(socket, data.uid)
            emit.gameplayInfo(socket, data.gid)
            emit.playedCards(socket, data.gid)
          })
          // Err handling
        }).catch(() => {
          socket.emit('returningsessioninvalid')
        })
      }).catch(() => {
        socket.emit('gamenotfound')
        this.removePlayerFromGame(data.uid, data.gid, socket)
      })
    },

    joinPlayerToGame (uid, gid) {
      return new Promise((resolve, reject) => {
        console.log('join player to game')
        const updates = {}

        getData.username(uid).then((data) => {
          updates['gameStates/' + gid + '/players/' + uid] = {
            name: data,
            points: 0,
            hasPlayed: false
          }

          updates['users/' + uid + '/state'] = '/game/' + gid

          database.ref().update(updates).then(() => {
            resolve()
          })
        })
      })
    },

    attemptCreateGame (data, socket) {
      console.log('requested to make game')
      console.log()
      const id = this.createGame(data.title, data.maxPlayers, data.uid, data.maxRounds, data.isPrivate, data.ownerName)
      socket.emit('gamecreatedsuccess', id)
    },

    createGame (name, maxPlayer, owner, maxRounds, isPrivate, ownerName) {
      var id = 'GID' + utils.generateID()
      var display = { name: name, ownerName: ownerName, playerCount: 1, maxPlayers: maxPlayer, isPrivate: isPrivate }
      var gameState = {
        name: name,
        spectators: [],
        whiteCardsData: {
          [owner]: {
            inventory: [],
            played: [],
            x: ''// this is to avoid firebase deleting the whole object for being empty
          }
        },
        gameplayInfo: {
          blackCard: {
            text: ''
          },
          round: 0,
          maxRounds: maxRounds,
          creatorUID: owner,
          playedCards: {},
          state: 'not started'
        },
        players: {}
      }
      database.ref('gameDisplayInfo/' + id).set(display)
      database.ref('gameStates/' + id).set(gameState)
      return id
    },

    returningsession (uid, socket) {
      database.ref('users/' + uid).once('value', (snap) => {
        if (!snap.exists()) {
          socket.emit('returningsessioninvalid')
        } else {
          const val = snap.val()
          socket.emit('returningsessionaccepted', { name: val.name, state: val.state })
          if (val.state.includes('GID')) {
            const gid = val.state.substr(val.state.indexOf('GID'), 13)
            socket.join(gid)
          }
        }
      })
    },

    applyforusername (data, socket) {
      data = utils.escapeHtml(data)
      if (socket === null) return
      const uid = 'UID' + utils.generateID()
      const secret = 'SEC' + utils.generateID()
      database.ref('users/' + uid).set({
        UID: uid,
        name: data,
        secret: secret,
        state: '/lobby' // current position in the flow eg game lobby etc
      }).then(() => {
        socket.emit('usernameaccepted', { uid: uid, name: data, state: '/lobby', secret: secret })
      })
    },

    clearInactiveUsers () {
      // 1800000
      const cutoff = Date.now() - 1800000 // 30 mins ago
      database.ref('users').orderByChild('lastSeen').endBefore(cutoff).once('value').then((snap) => {
        this.logout(snap.key)
      })
    },

    selectCards (uid, gid, cards, callback) {
      console.log(cards)
      if (!cards) {
        callback({ failed: 'none sent' })
        return
      }

      Promise.all([
        getData.gameplayInfo(gid),
        getData.usersWhiteCards(uid, gid)
      ]).then((values) => {
        const gameInfo = values[0]
        const userCards = values[1]

        if (cards.length > gameInfo.blackCard.rule) {
          callback({ failed: 'too many' })
          return
        }
        if (userCards.played) {
          callback({ failed: 'already played' })
          return
        }
        const keys = Object.keys(userCards.inventory)
        const valid = cards.every(v => keys.includes(v)) // checks keys provided are actually part of inventory
        if (!valid) {
          callback({ failed: 'not exist' })
          return
        }

        this.playCards(gid, uid, cards, userCards).then((res) => {
          if (res === 'success') {
            callback({ success: true })
          }
        })

        //
      }).catch((err) => {
        console.log(err)
        callback({ failed: 'unknown' })
      })
    },
    playCards (gid, uid, cards, userCards) {
      const updates = {}
      return new Promise((resolve, reject) => {
        const cardObjs = []
        for (let i = 0; i < cards.length; i++) {
          cardObjs.push(userCards.inventory[cards[i]])
          updates['gameStates/' + gid + '/whiteCardsData/' + uid + '/inventory/' + cards[i]] = null
        }

        updates['gameStates/' + gid + '/playedCards/' + uid] = cardObjs
        database.ref().update(updates).then(() => {
          resolve('success')

          this.isAllCardsPlayed(gid).then((result) => {
            if (result) {
              this.progressGame(gid) // should go to voting stage
            }
          }).catch((err) => {
            console.log(err.message)
          })
        })
      })
    },
    isAllCardsPlayed (gid) {
      return new Promise((resolve, reject) => {
        // todo check if last player to play then progress
        Promise.all([getData.playedCards(gid), getData.whiteCardsData(gid)]).then((values) => {
          const playedCards = values[0]
          const whiteCards = values[1]
          const numOfPlayedCards = Object.keys(playedCards).length
          const numOfPlayers = Object.keys(whiteCards).length
          if (!playedCards) {
            resolve(false)
          } else if (numOfPlayedCards === numOfPlayers) { // if everyone played
            resolve(true)
          } else if (numOfPlayedCards < numOfPlayers) {
            resolve(false)
          } else {
            reject(new Error('Error checking if all played'))
          }
        }).catch(err => {
          if (err.message.includes('playedCards') && err.message.includes('Could not get data:')) {
            resolve(false)
          } else {
            reject(new Error('Error getting data on played players'))
          }
        })
      })
    }

  }
}

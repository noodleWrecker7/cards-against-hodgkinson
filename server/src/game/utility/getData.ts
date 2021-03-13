// Short hands for getting data
import firebase from 'firebase'
import { userWhiteCardsType, GetData, gameDisplayInfo } from '../../../types'
import { logger } from '@noodlewrecker7/logger'
import Logger = logger.Logger

type Database = firebase.database.Database
export default (database: Database): GetData => {
  return new _GetData(database)
}

class _GetData implements GetData {
  database: Database

  constructor(database: Database) {
    this.database = database
  }

  roundNum(gid: string): Promise<number> {
    return this.getOnce('gameStates/' + gid + '/gameplayInfo/round')
  }

  usersWhiteCards(uid: string, gid: string): Promise<userWhiteCardsType> {
    return this.getOnce('/gameStates/' + gid + '/whiteCardsData/' + uid)
  }

  lobbies(): Promise<{ [gid: string]: gameDisplayInfo }> {
    return new Promise((resolve) => {
      this.database
        .ref('gameDisplayInfo')
        .orderByChild('isPrivate')
        .equalTo(false)
        .once('value', (snap) => {
          resolve(snap.val())
        })
    })
  }

  whiteCardsData(gid: string) {
    return this.getOnce('gameStates/' + gid + '/whiteCardsData')
  }

  gamePlayers(gid: string) {
    return this.getOnce('gameStates/' + gid + '/players')
  }

  playerScore(gid: string, uid: string) {
    return this.getOnce('gameStates/' + gid + '/players/' + uid + '/points')
  }

  userState(uid: string) {
    return this.getOnce('users/' + uid + '/state')
  }

  game(gid: string) {
    return this.getOnce('gameStates/' + gid)
  }

  gameplayInfo(gid: string) {
    return this.getOnce('gameStates/' + gid + '/gameplayInfo')
  }

  playedCards(gid: string) {
    return this.getOnce('gameStates/' + gid + '/playedCards')
  }

  usersPlayedCards(gid: string, uid: string) {
    return this.getOnce('gameStates/' + gid + '/playedCards/' + uid)
  }

  gameplayState(gid: string) {
    return this.getOnce('gameStates/' + gid + '/gameplayInfo/state')
  }

  username(uid: string) {
    return this.getOnce('users/' + uid + '/name')
  }

  czar(gid: string) {
    return this.getOnce('gameStates/' + gid + '/gameplayInfo/czar')
  }

  private getOnce(ref: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.database
        .ref(ref)
        .once('value')
        .then((snap) => {
          if (snap.exists()) {
            resolve(snap.val())
          } else {
            const err = new Error('Could not get data: ' + ref)
            Logger.debug(err.stack)
            Logger.trace('Could not get data: ' + ref)
            reject(err)
          }
        })
    })
  }
}

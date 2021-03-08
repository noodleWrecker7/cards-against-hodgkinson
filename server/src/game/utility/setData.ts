// Short hands for setting data
import firebase from 'firebase'
import { SetData } from '../../../types'
type Database = firebase.database.Database

export default (database: Database): SetData => {
  return new _setData(database)
}

class _setData implements SetData {
  database: Database
  constructor(database: Database) {
    this.database = database
  }

  userState(uid: string, value: string) {
    return this.set('users/' + uid + '/state', value)
  }

  private set(ref: string, value: unknown): Promise<never> {
    return <Promise<never>>this.database.ref(ref).set(value)
  }

  czar(gid: string, value: string) {
    return this.set('gameStates/' + gid + '/gameplayInfo/czar', value)
  }

  gamePlayerDoing(gid: string, uid: string, value: string) {
    return this.set('gameStates/' + gid + '/players/' + uid + '/doing', value)
  }

  playerScore(gid: string, uid: string, value: number) {
    return this.set('gameStates/' + gid + '/players/' + uid + '/points', value)
  }

  playedCards(gid: string, value: unknown) {
    return this.set('gameStates/' + gid + '/playedCards', value)
  }
  roundNum(gid: string, value: number) {
    return this.set('gameStates/' + gid + '/gameplayInfo/round', value)
  }
}

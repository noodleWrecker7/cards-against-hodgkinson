// THIS FILE IS FOR METHODS WHICH BROADCAST DATA TO A SOCKET/ROOM

import { Socket } from 'socket.io'
import { gameStateType, GetData } from '../../../types'
import firebase from 'firebase'

type Database = firebase.database.Database

export default (database: Database, getData: GetData) => {
  return new Emitters(database, getData)
}

class Emitters {
  database: Database
  getData: GetData

  constructor(database: Database, getData: GetData) {
    this.database = database
    this.getData = getData
  }

  state(socket: Socket, uid: string) {
    this.getData
      .userState(uid)
      .then((data: string) => {
        socket.emit('setstate', data)
      })
      .catch((err: Error) => {
        console.log(err)
      })
  }

  gameplayInfo(socket: Socket, gid: string) {
    this.getData
      .gameplayInfo(gid)
      .then((data: gameStateType['gameplayInfo']) => {
        socket.emit('sendgameinfo', data)
      })
      .catch((err: Error) => {
        console.log(err)
      })
  }

  playedCards(socket: Socket, gid: string) {
    this.getData
      .playedCards(gid)
      .then((data: gameStateType['playedCards']) => {
        socket.emit('topcards', data)
      })
      .catch((err: Error) => {
        console.log(err)
      })
  }
}

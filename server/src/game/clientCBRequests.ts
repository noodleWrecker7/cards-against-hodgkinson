// THIS FILE IS FOR WHEN THE CLIENT REQUESTS SOME DATA WITH A CALLBACK FOR THE DATA

import { Socket } from 'socket.io'
import { GetData, sockCB, Utils } from '../../types'

export default (getData: GetData, utils: Utils): ClientCBRequests => {
  return new ClientCBRequests(getData, utils)
}

class ClientCBRequests {
  getData: GetData
  utils: Utils

  constructor(getData: GetData, utils: Utils) {
    this.getData = getData
    this.utils = utils
  }

  requestlobbies(uid: string, callback: sockCB, socket: Socket) {
    this.utils
      .handleCall(uid, socket)
      .then(() => {
        this.getData.lobbies().then((value) => {
          callback({ error: null, data: value })
        })
      })
      .catch((err: Error) => {
        callback({ error: err.message })
      })
  }

  requestwhitecards(uid: string, gid: string, callback: sockCB, socket: Socket) {
    this.utils.handleCall(uid, socket).then(() => {
      this.getData
        .usersWhiteCards(uid, gid)
        .then((data) => {
          callback({ error: null, data: data.inventory })
        })
        .catch((err: Error) => {
          callback({ error: err.message })
        })
    })
  }
  /*
  requesttopcards(gid: string, callback: sockCB) {
    this.getData
      .playedCards(gid)
      .then((data) => {
        callback({ error: null, data: data })
      })
      .catch((err: Error) => {
        callback({ error: err.message })
      })
  }*/
}

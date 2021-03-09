import {Server} from 'socket.io'
import firebase from 'firebase'
import _setData from './utility/setData'
import _utils from './utility/utils'
import _emitters from './utility/clientEmitters'
import clientCBRequests from './clientCBRequests'
import firebaseListeners from './init/firebaseListeners'
import gameFuncs from './gameFuncs'
import socketListeners from './init/socketListeners'
import {GetData, SetData, Utils} from '../../types'
import _getData from './utility/getData'

type Database = firebase.database.Database

export default (io: Server, database: Database): void => {
  // const methods = require('./socketMethods')(io, database)
  const getData: GetData = _getData(database)
  const setData: SetData = _setData(database)
  const utils: Utils = _utils(database)
  const emitters = _emitters(database, getData)
  const cb = clientCBRequests(getData, utils)
  firebaseListeners(io, database)
  const funcs = gameFuncs(database, utils, getData, setData, emitters)

  socketListeners(io, funcs, utils, cb)

  setInterval(() => {
    funcs.clearInactiveUsers()
  }, 1800000)
}

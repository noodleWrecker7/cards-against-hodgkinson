module.exports = (io, database) => {
  // const methods = require('./socketMethods')(io, database)
  const getData = require('./utility/getData')(database)
  const setData = require('./utility/setData')(database)
  const utils = require('./utility/utils')(database)
  const emitters = require('./utility/clientEmitters')(database, getData)
  const cb = require('./clientCBRequests')(getData, utils)
  require('./init/firebaseListeners')(io, database)
  const funcs = require('./gameFuncs')(database, utils, getData, setData, emitters)

  require('./init/socketListeners')(io, funcs, utils.handleCall, cb)

  setInterval(function () {
    funcs.clearInactiveUsers()
  }, 1800000)
}

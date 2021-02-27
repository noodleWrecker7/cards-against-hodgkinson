// THIS FILE IS FOR WHEN THE CLIENT REQUESTS SOME DATA WITH A CALLBACK FOR THE DATA

module.exports = (getData, utils) => {
  return {
    requestlobbies (data, callback, socket) {
      utils.handleCall(data.uid, socket).then(() => {
        getData.lobbies().then((value) => {
          callback({ error: null, data: value })
        })
      }).catch((err) => {
        callback({ error: err.message })
      })
    },
    requestwhitecards (data, callback, socket) {
      utils.handleCall(data.uid, socket).then(() => {
        getData.usersWhiteCards(data.uid, data.gid).then((data) => {
          callback({ error: null, data: data })
        }).catch((err) => {
          callback({ error: err.message })
        })
      })
    }
  }
}

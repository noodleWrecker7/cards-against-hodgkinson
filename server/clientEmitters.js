// THIS FILE IS FOR METHODS WHICH BROADCAST DATA TO A SOCKET/ROOM

module.exports = (database, getData) => {
  return {
    state (socket, uid) {
      getData.userState(uid).then((data) => {
        socket.emit('setstate', data)
      })
    },
    gameplayInfo (socket, gid) {
      getData.gameplayInfo(gid).then((data) => {
        socket.emit('sendgameinfo', data)
      })
    },
    playedCards (socket, gid) {
      getData.playedCards(gid).then((data) => {
        socket.emit('topcards', data)
      })
    }
  }
}

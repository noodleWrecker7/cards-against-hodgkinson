export default {
  setVersionName (state, v) {
    state.versionName = v
  },
  setLoggedIn (state, data) {
    state.loggedIn = data
  },

  setUsername (state, data) {
    state.userName = data
  },
  setUID (state, data) {
    state.UID = data
  },

  setLobbiesList (state, data) {
    state.lobbyList = data
  },
  setGID (state, data) {
    state.GID = data
  },
  setGameData (state, data) {
    state.gameData = data
  },
  setPlayerList (state, data) {
    state.playerList = data
  }
}

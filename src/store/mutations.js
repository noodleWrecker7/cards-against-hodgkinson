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
    console.log('commit playerlist')
    state.playerList = data
  },
  setSecret (state, data) {
    state.secret = data
  },
  setState (state, data) {
    state.state = data
  },
  setPlayerWhiteCards (state, data) {
    state.playerWhiteCards = data
  },
  setTopCards (state, data) {
    state.topCards = data
  },
  clearState (state) {
    state = {}
  },
  setHasSubmittedCards (state, data) {
    state.hasSubmittedCards = data
  }
}

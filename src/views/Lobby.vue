<template>
  <div id="lobby">
    <div id="controls-tab">
      <button id="refresh-button" @click="refreshLobbies"><img src="@/assets/refresh.svg"/>Refresh list</button>
      <button @click="toggleModal">Create game</button>
    </div>
    <div id="lobby-cards-container">
      <lobby-card v-for="(lobby, gid) in lobbyList" :game="lobby" :key="gid" :gid="gid"/>
    </div>
    <transition name="slide">
      <div id="create-game-form" v-if="displaymodal">
        <h3>Create Game</h3>

        <label class="label">Title:
          <input v-model="newGame.title" placeholder="Title">
        </label>
        <br>
        <label>Max Players:<br>
          <div id="max-players-container"><input type="range" max="24" min="3" v-model="newGame.maxPlayers"><input
            min="3" max="24" type="number" v-model="newGame.maxPlayers"></div>
        </label>
        <br>
        <label>Max Rounds:<br>
          <div id="max-rounds-container"><input type="range" max="24" min="2" v-model="newGame.maxRounds"><input
            min="2" max="24" type="number" v-model="newGame.maxRounds"></div>
        </label>
        <label>Private:<br>
          <input type="checkbox" v-model="newGame.isPrivate">
        </label>
        <button class="submit" @click="createTheGame">Submit</button>
      </div>
    </transition>
  </div>
</template>

<script>
import LobbyCard from '@/components/lobby/lobbyCard'
import { mapState } from 'vuex'

export default {
  name: 'Lobby',
  components: { LobbyCard },
  computed: {
    ...mapState({
      lobbyList: state => state.lobbyList
    })
  },
  data () {
    return {
      displaymodal: true,
      newGame: { title: '', maxPlayers: 9, maxRounds: 10, isPrivate: true }
    }
  },
  sockets: {
    gamecreatedsuccess (data) {
      this.$router.push('/game/' + data)
    }
  },
  methods: {
    createTheGame () {
      console.log(this.newGame)
      this.$socket.client.emit('creategame', {
        title: this.newGame.title,
        maxPlayers: this.newGame.maxPlayers,
        maxRounds: this.newGame.maxRounds,
        isPrivate: this.newGame.isPrivate,
        uid: this.$store.state.UID,
        ownerName: this.$store.state.userName
      })
    },
    toggleModal () {
      this.displaymodal = !this.displaymodal
    },
    refreshLobbies () {
      this.$socket.client.emit('requestlobbies', { uid: this.$store.state.UID }, (response) => {
        console.log('lobbies recieve')
        if (!response.error) {
          this.$store.commit('setLobbiesList', response.data)
        } else if (response.error === 'rate limit') {
          alert('You are doing that too fast\nPlease slow down')
        }
      })
    }
  },
  mounted () {
    if (!this.$store.state.loggedIn) {
      console.log('at lobby not logged in')
      this.$router.push('/')
    }
    this.refreshLobbies()
  }
}
</script>
<style scoped>
h3 {
  margin-bottom: 15%;
}

input {
  margin-bottom: 10%;
}

.submit {
  border-radius: 5px;
  background-color: lime;
  border: none;
  padding: 2%;
  width: 20%;
  font-size: 2vh;
  font-family: Montserrat, sans-serif;
  color: black;
  position: absolute;
  bottom: 5%;
  left: 40%;
}

.slide-item {
  display: inline-block;
  margin-right: 10px;
  box-shadow: 5px 5px 10px 1px black;
}

.slide-enter-active, .slide-leave-active {
  transition: all 1s;
}

.slide-enter, .slide-leave-to /* .list-leave-active below version 2.1.8 */
{
  opacity: 0;
  transform: translateX(-70vw);
  box-shadow: none;
}

#max-players-container {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;

}

#max-players-container > input {
  margin-left: 5px;
  margin-right: 5px;
}

#create-game-form {
  position: fixed;
  background-color: whitesmoke;
  width: 30%;
  height: 50%;
  margin-left: auto;
  margin-right: auto;
  left: 35%;
  border-radius: 10px;
  box-shadow: 5px 5px 10px 1px black;
  padding-left: 5%;
  padding-right: 5%;
  box-sizing: border-box;
}

img {
  height: 1em;
  margin-right: .5em;
}

#refresh-button {
  font-size: small;
}

#controls-tab {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  background-color: dodgerblue;

}

#lobby-cards-container {
  display: flex;
  flex-flow: row wrap;
}

</style>

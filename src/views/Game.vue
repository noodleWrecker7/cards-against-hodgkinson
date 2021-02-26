<template>
  <div id="game-page">
    <div id="control-bar">Controls
      <button v-if="$store.state.isOwner" @click="displaycontrols=!displaycontrols">
        {{ this.displaycontrols ? 'Hide' : 'Show' }} Controls
      </button>
    </div>
    <div id="game-container">
      <div id="left-section">
        <div id="black-card-container">
          <blackcard :carddata="gameData.blackCard"/>
          <button>Submit answer</button>
        </div>
        <div id="player-list-container">
          <p v-for="(player, id) in playerList" :key="id">{{ player.name }}</p>
        </div>
        <!--      <div id="top-white-cards-container">-->

        <!--      </div>-->
      </div>
      <div id="right-section">
        <div id="top-white-cards-container">
          <whitecard :key="x" v-for="x in 18"/>
        </div>

        <div id="player-cards-container" v-if="gameData.round >0">
          <whitecard @cardclicked="toggleCardSelected" :key="key" :cardKey="key" v-for="(card, key) in playerWhiteCards"
                     :cardData="card"/>
        </div>
      </div>
    </div>

    <transition name="slide">
      <div id="create-game-form" v-if="displaycontrols">
        <h3>Game Controls</h3>
        <button @click="startGame">Start</button>
      </div>
    </transition>
  </div>
</template>

<script>
import Whitecard from '@/components/game/whitecard'
import Blackcard from '@/components/game/blackcard'
import { mapState } from 'vuex'

export default {
  name: 'Game',
  components: {
    Whitecard,
    Blackcard
  },
  props: [
    'gameID'
  ],
  methods: {
    toggleCardSelected (key) {
      console.log(key)
      if (this.selectedCards.includes(key)) {
        this.selectedCards.splice(this.selectedCards.indexOf(key), 1)
      } else {
        if (this.selectedCards.length === this.gameData.blackCard.rule) {
          // todo custom alert probably in app.vue
        } else {
          this.selectedCards.push(key)
        }
      }
    },
    startGame () {
      this.$socket.client.emit('startgame', {
        uid: this.$store.state.UID,
        gid: this.$store.state.GID
      })
    }
  },
  computed: {
    ...mapState([
      'gameData',
      'playerList',
      'playerWhiteCards'
    ]
    )
  },
  data () {
    return {
      displaycontrols: false,
      selectedCards: []
    }
  },
  sockets: {
    gamenotfound () {
      console.log('game no find')
      // this.$router.replace('//lobby')
    }

  },
  mounted () {
    if (!this.$store.state.loggedIn) {
      this.$router.push('/')
    }
    console.log(this.$route.fullPath)
    console.log(this.gameID)
    this.$store.dispatch('setGID', this.gameID)
    this.$socket.client.emit('arriveatgamepage', {
      uid: this.$store.state.UID,
      gid: this.gameID
    })
  }
}
</script>

<style scoped>
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
  bottom: 10%;
}

#game-page {
  display: flex;
  flex-flow: column;
}

#game-container {
  display: flex;
  flex-flow: row nowrap;
  flex-grow: 1;
}

#right-section {
  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
}

#left-section {
  border: 1px solid black;
}

#top-white-cards-container {
  flex-grow: 1.5;
  display: flex;
  flex-flow: row wrap;
  border: 1px solid red;
  padding-top: 4em;
  box-sizing: border-box;
}

#black-card-container {
}

#player-cards-container {
  display: flex;
  flex-flow: row wrap;
  border: 1px solid green;
  padding-bottom: 5em;
}

#black-card-container {
  width: min-content;
  border: 1px solid black
}

#control-bar {
  background-color: grey;
}

.slide-item {
  display: inline-block;
  margin-right: 10px;
  box-shadow: 5px 5px 10px 1px black;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s;
}

.slide-enter, .slide-leave-to /* .list-leave-active below version 2.1.8 */
{
  opacity: 0;
  transform: translateY(70vh);
  box-shadow: none;
}
</style>

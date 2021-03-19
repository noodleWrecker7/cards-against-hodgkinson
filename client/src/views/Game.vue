<template>
  <div id="game-page">
    <div id="control-bar">
      <button id="controlsbutton" v-if="$store.state.isOwner" @click="displaycontrols=!displaycontrols">
        {{ this.displaycontrols ? "Hide" : "Show" }} Controls
      </button>
      <button id="leavegamebutton" @click="leaveGame">Leave game</button>
    </div>
    <div id="game-container">
      <div id="left-section">
        <div id="black-card-container">
          <blackcard :carddata="gameData.blackCard" />
          <button :disabled="hasSubmittedCards" id="submitbutton" @click="submitCards">Submit answer</button>
        </div>
        <div id="player-list-container">
          <p v-for="(player, id) in playerList" :key="id">{{ player.name
            }}....{{ player.points }}....{{ player.doing }}</p>
        </div>

      </div>
      <div id="right-section">
        <div id="top-white-cards-container">
          <!--          <whitecard :key="x" v-for="x in 18"/>-->
          <div :key="key" :userID="key" v-for="(user,key) in topCards">
            <whitecard @cardclicked="toggleTopCardSelected" :key="index" v-for="(card, index) in user"
                       :card-data="gameData.state !== 1 ?card:{text:''}"
                       :class="{selected: votedwinner === key}"
                       :cardKey="key" />
          </div>
        </div>

        <div id="player-cards-container" v-if="gameData.round >0">
          <whitecard @cardclicked="toggleBottomCardSelected" :key="key" :cardKey="key"
                     v-for="(card, key) in playerWhiteCards"
                     :cardData="card" :class="{selected: selectedCards.includes(key)}" />
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
import Whitecard from '../components/game/whitecard'
import Blackcard from '../components/game/blackcard'
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
    leaveGame () {
      if (!this.gameID) {
        return
      }
      this.$socket.client.emit('leavegame', { gid: this.gameID, uid: this.$store.state.UID })
      this.$store.dispatch('leaveGame')
      this.$router.push('/lobby')
    },
    playBottomCards () {
      if (this.selectedCards.length > this.gameData.blackCard.rule) {
        return
      }
      this.$socket.client.emit('selectcards', {
        uid: this.$store.state.UID,
        gid: this.$store.state.GID,
        cards: this.selectedCards
      }, (data) => {
        if (data.data) {
          this.retries = 0
          this.selectedCards = []
          this.$store.commit('setHasSubmittedCards', true)
          this.votedwinner = ''
        } else if (data.error) {
          if (data.error === 'rate limit') {
            if (this.retries < 3) {
              this.retries++
              setTimeout(this.submitCards, 2000)
            }
          }
        }
      })
    },
    voteTopCards () {
      if (this.votedwinner === '') {
        alert('You need to pick a winner')
        return
      }
      if (!this.isCzar) {
        alert('It is not your turn to pick a winner')
        return
      }

      this.$socket.client.emit('czarpickcard', {
        uid: this.$store.state.UID,
        gid: this.$store.state.GID,
        winner: this.votedwinner
      })
    },
    submitCards () {
      if (this.gameData.state === 1) {
        this.playBottomCards()
        return
      }
      if (this.gameData.czar === this.$store.state.UID) {
        // win card
        this.voteTopCards()
      }
    },
    toggleTopCardSelected (key) {
      console.log(key)
      if (this.votedwinner === key) {
        this.votedwinner = ''
      } else {
        this.votedwinner = key
      }
    },
    toggleBottomCardSelected (key) {
      if (this.gameData.state !== 1) {
        alert('Now is not the time to play your card\n;(')
        return
      }
      if (this.isCzar) {
        alert('You are the card Czar this round, you do not get to play ;(')
        return
      }
      console.log(key)
      if (this.selectedCards.includes(key)) {
        this.selectedCards.splice(this.selectedCards.indexOf(key), 1)
        return
      }

      if (this.selectedCards.length === this.gameData.blackCard.rule) {
        alert('Thats too many cards!\nYou can only play ' + this.gameData.blackCard.rule + ' card(s) this round')
        return
      }
      this.selectedCards.push(key)
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
      'playerWhiteCards',
      'hasSubmittedCards',
      'topCards',
      'isCzar'
    ]
    )
  },
  data () {
    return {
      displaycontrols: false,
      selectedCards: [],
      retries: 0,
      votedwinner: '' // todo this
    }
  },
  sockets: {
    gamenotfound () {
      console.log('game no find')
      // this.$router.replace('//lobby')
    },
    topcards (data) {
      this.$store.dispatch('setTopCards', data)
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
#submitbutton {
  background-color: #42ff42;
  color: black;
  border-radius: 5px;
  border-color: #323232;
}

#controlsbutton {
  background-color: #323232;
  color: white;
  border-radius: 5px;
  border-color: #323232;
  margin-bottom: 5px;
}

#player-list-container {
  color: white;
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
  background-color: dodgerblue;
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

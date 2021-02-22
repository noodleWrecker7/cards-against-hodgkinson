<template>
  <div id="game-container">
    <div id="control-bar">Controls</div>
    <div id="top-section">
      <div id="black-card-container">
        <blackcard cardtext="Question?"/>
        <button>Submit answer</button>
      </div>
      <div id="top-white-cards-container">
        <whitecard/>
      </div>
    </div>
    <div id="bottom-section">
      <div id="player-list-container"></div>
      <div id="player-cards-container">
        <whitecard :key="x" v-for="x in 5"/>
      </div>
    </div>
  </div>
</template>

<script>
import Whitecard from '@/components/game/whitecard'
import Blackcard from '@/components/game/blackcard'
import { mapState } from 'vuex'

export default {
  name: 'Game',
  components: { Whitecard, Blackcard },
  props: [
    'gameID'
  ],
  computed: {
    ...mapState([
      'gameData'
    ]
    )
  },
  mounted () {
    if (!this.$store.state.loggedIn) {
      this.$router.push('/')
    }
    console.log(this.gameID)
  }
}
</script>

<style scoped>
#player-cards-container{
  display: flex;
  flex-flow: row wrap;
}
#black-card-container{
  width: min-content;
  border: 1px solid black
}
#control-bar {
  background-color: grey;
}
</style>

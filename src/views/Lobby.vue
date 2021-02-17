<template>
  <div id="lobby">
    <div id="lobby-cards-container">
      <lobby-card v-for="lobby in lobbyList" :game="lobby" :key="lobby.gameID"/>
    </div>
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
  mounted () {
    if (!this.$store.state.loggedIn) {
      this.$router.push('/')
    }
  }
}
</script>
<style scoped>
#lobby-cards-container {
  display: flex;
  flex-flow: row wrap;
}

</style>

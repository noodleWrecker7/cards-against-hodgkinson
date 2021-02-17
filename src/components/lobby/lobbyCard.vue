<template>
<div class="card">
  {{game.displayName}}
  <br>
  {{game.playerCount}} / {{game.maxPlayers}}
  <div></div>
  <button @click="join">Join</button>
</div>
</template>

<script>
export default {
  name: 'lobbyCard',
  props: [
    'game'
  ],
  methods: {
    join () {
      // dispatch action join game etc
      console.log(this.game.gameID)
    }
  }
}
</script>

<style scoped>
.card {
  border: solid 1px black;
  border-radius: 10px;
  margin: 1vw;
}
</style>

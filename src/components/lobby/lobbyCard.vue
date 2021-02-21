<template>
<div class="card">
  {{game.name}}
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
    'game',
    'gid'
  ],
  methods: {
    join () {
      // dispatch action join game etc
      console.log(this.gid)
    }
  },
  mounted () {
    console.log(this.gid)
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

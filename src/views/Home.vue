<template>
  <div class="home">
    <h1>Cards Against Hodgkinson</h1>
    <input v-model="username" placeholder="Username..."/><br>
    <button @click="submitName" id="submitname">Enter</button>

  </div>
</template>

<script>
// @ is an alias to /src

export default {
  name: 'Home',
  sockets: {
    usernameunavailable () { // never actually sent anymore
      alert('That username is unavailable :(\nTry a new name?')
    },
    usernameaccepted (data) {
      this.$store.dispatch('logIn', data)
      this.$store.commit('setSecret', data.secret)
      this.$router.push(data.state)
      window.location.reload()
    }
  },
  components: {
  },
  data () {
    return {
      username: ''
    }
  },
  methods: {
    submitName () {
      console.log(this.username)
      this.$socket.client.emit('applyforusername', this.username)
    }
  },
  mounted () {
  }
}
</script>

<style scoped>

#submitname{
  background-color: dodgerblue;
  border-radius: 5px;
  padding: .4em;
  border: 1px dodgerblue ;
  margin-top: 1em;
  font-size: medium;
}

h1 {
  font-size: xxx-large;
  margin-top: 25vh;
  margin-bottom: 10vh;
  color: inherit;
}
</style>

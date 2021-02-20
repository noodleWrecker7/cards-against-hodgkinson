<template>
  <div class="home">
    <h1>Cards Against Hodgkinson</h1>
    <input v-model="username" placeholder="Username..."/>
    <button @click="submitName">Submit</button>

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
      this.$router.push(data.state)
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
    if (this.$store.state.loggedIn) {
      this.$router.push('/lobby')
    }
  }
}
</script>

<style scoped>

h1 {
  font-size: xxx-large;
  margin-top: 25vh;
  margin-bottom: 10vh;
}
</style>

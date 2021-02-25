<template>
  <div id="app">
    <div id="nav">
      <p id="version-tag">{{ this.$store.state.versionName }}</p>
      <div v-if="$store.state.loggedIn">

        You are logged in as {{ this.$store.state.userName }}
        <button @click="logout()" id="logout-button">Log Out</button>
      </div>

      <router-link to="/">Home</router-link>
      |
      <router-link to="/lobby">Lobby</router-link>
      |
      <router-link to="/game">Game</router-link>

    </div>
    <router-view class="router-view"/>
  </div>
</template>

<script>
export default {
  name: 'app',
  methods: {
    logout () {
      this.$socket.client.emit('logout', { uid: this.$store.state.UID })
      this.$store.dispatch('logOut')
      this.$router.push('/')
    }
  },
  sockets: {
    secretnotmatch () {
      console.error('Secret rejected by server')
    },
    returningsessionaccepted (data) {
      // set username
      // set logged in
      this.$store.dispatch('logIn', { name: data.name, uid: this.$store.state.UID })
      // go to state
      if (this.$route.fullPath === data.state) {
        console.log('route same')
        return
      }
      this.$store.dispatch('socket_setstate', data.state)
      if (this.$route.fullPath !== data.state) {
        this.$router.go(data.state)
      }
    },
    returningsessioninvalid () {
      this.$store.dispatch('logOut')
      this.$router.push('/')
      // clear uid
      // clear name
      // go to home
    }
  }
}
</script>

<style>
.router-view {
  flex-grow: 1;
}
#logout-button {
  float: right;
}

#version-tag {
  position: fixed;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
  display: flex;
  flex-flow: column nowrap;
}

#nav {
  padding: 30px;
  padding-top: 0;
  padding-bottom: 10px;
  background-color: grey;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>

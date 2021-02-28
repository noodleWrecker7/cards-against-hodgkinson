<template>
  <div id="app">
    <div id="nav">
      <button @click="logout()" id="logout-button">Log Out</button>
      <p id="version-tag">{{ this.$store.state.versionName }}</p>
      <div class="navSection" v-if="$store.state.loggedIn">
        <div class="usernamecontainer">You are logged in as:
          <p class="username">{{ this.$store.state.userName }}</p>
        </div>
      </div>

    </div>
    <router-view class="router-view"/>
  </div>
</template>

<script>
export default {
  name: 'app',
  methods: {
    logout () {
      this.$store.dispatch('logOut')
      this.$router.push('/')
      this.$socket.client.emit('logout', { uid: this.$store.state.UID })
    }
  },
  sockets: {
    secretnotmatch () {
      console.error('Secret rejected by server')
    },
    returningsessionaccepted (data) {
      console.log('accepted session')
      // set username
      // set logged in
      this.$store.dispatch('logIn', { name: data.name, uid: this.$store.state.UID })
      // go to state
      if (this.$route.fullPath === data.state) {
        console.log('route same')
        return
      }
      this.$store.dispatch('socket_setstate', data.state)
      console.log('changing path')
      const state = data.state
      const route = this.$route.fullPath
      console.log({ state, route })
      this.$router.push(data.state)
    },
    returningsessioninvalid () {
      this.$store.dispatch('logOut')
      if (this.$route.fullPath !== '/') {
        this.$router.push('/')
      }
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
  /*margin-left: auto;*/
  position: fixed;
  right: 0;
  margin-right: 5px
}

#version-tag {
  position: fixed;
}
.navSection{
  display: flex;
  align-items: center;
  justify-content: center;
}
.username {
  display: inline-block;
  font-weight: bold;
}

.usernamecontainer {
  color: white;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
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
  background-color: #323232;
}

#nav {
  padding: 10px;
  padding-top: 0;
  padding-bottom: 5px;
  background-color: dodgerblue;
  font-size: large;
  color: #acacac;
  min-height: 50px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>

<template>
  <div id="app">
    <div id="nav">
      <p id="version-tag">{{ this.$store.state.versionName }}</p>
      <div v-if="$store.state.userName">

        You are logged in as {{this.$store.state.userName}}
        <button @click="logout()" id="logout-button">Log Out</button>
      </div>

      <router-link to="/">Home</router-link>
      |
      <router-link to="/lobby">Lobby</router-link>
      |
      <router-link to="/game">Game</router-link>

    </div>
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'app',
  methods: {
    logout () {
      this.$store.dispatch('logOut')
      this.$router.push('/')
    }
  }
}
</script>

<style>
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
}

#nav {
  padding: 30px;
  padding-top: 0;
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

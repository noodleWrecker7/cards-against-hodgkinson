<template>
  <div id="app" :class="isDarkMode?'dark-mode':'light-mode'">
    <div id="nav">
      <button @click="logout()" id="logout-button">Log Out</button>
      <button class="themetogglebutton" @click="toggleTheme">
        <img class="themetoggleimage" v-if="$store.state.isDarkMode" src="@/assets/moon.svg"
             alt="light/dark theme toggle"/>
        <img class="themetoggleimage" v-else src="@/assets/sun.svg" alt="light/dark theme toggle"/>
      </button>
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
import { mapState } from 'vuex'
export default {
  name: 'app',
  methods: {
    toggleTheme () {
      this.$store.commit('setDarkMode', !this.$store.state.isDarkMode)
    },
    logout () {
      this.$store.dispatch('logOut')
      this.$router.push('/')
      this.$socket.client.emit('logout', { uid: this.$store.state.UID })
    }
  },
  computed: {
    ...mapState([
      'isDarkMode'
    ]),
    modeimage () {
      return this.isDarkMode ? 'moon.svg' : 'sun.svg'
    }
  },
  data () {
    return {
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
      this.$store.dispatch('logIn', {
        name: data.name,
        uid: this.$store.state.UID
      })
      // go to state
      if (this.$route.fullPath === data.state) {
        console.log('route same')
        return
      }
      this.$store.dispatch('socket_setstate', data.state)
      console.log('changing path')
      const state = data.state
      const route = this.$route.fullPath
      console.log({
        state,
        route
      })
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
.themetogglebutton {
  border: none;
  background: none;
}

.themetoggleimage {
  width: 2em
}

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
  top: 0;
  left: 5px
}

.navSection {
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
  height: 100vh;
  display: flex;
  flex-flow: column nowrap;
}

.dark-mode {
  background-color: #323232;
  color: white;
}

.light-mode {
  background-color: white;
  color: #323232;
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

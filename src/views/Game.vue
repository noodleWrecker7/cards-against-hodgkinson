<template>
<div>Game</div>
</template>

<script>
export default {
  name: 'Game',
  mounted () {
    if (!this.$store.state.loggedIn) {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>

</style>

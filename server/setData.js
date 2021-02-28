module.exports = (database) => {
  return {
    userState (uid, value) {
      this.set('users/' + uid + '/state', value)
    },
    set (ref, value) {
      database.ref(ref).set(value)
    }
  }
}

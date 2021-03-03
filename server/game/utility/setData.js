module.exports = (database) => {
  return {
    userState (uid, value) {
      database.set('users/' + uid + '/state', value)
    },
    set (ref, value) {
      database.ref(ref).set(value)
    }
  }
}

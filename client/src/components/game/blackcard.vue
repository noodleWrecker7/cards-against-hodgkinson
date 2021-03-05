<template>
<div class="card-itself"><p class="black-card-text">{{carddata.text}}</p> <p class="pack-name">{{carddata.pack}}</p></div>
</template>

<script>
export default {
  name: 'blackcard',
  props: [
    'carddata'
  ]
}
</script>

<style scoped>
.black-card-text {
  color: white;
  padding-top: 2em;
}
.card-itself {
  border-radius: 20px;
  background-color: #0e0e0e;
  width: 12em;
  height:18em;
  margin: 1em;
}
</style>

<template>
<div class="card-itself"><p class="black-card-text">{{cardtext}}</p></div>
</template>

<script>
export default {
  name: 'blackcard',
  props: [
    'cardtext'
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
}
</style>

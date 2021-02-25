<template>
<div class="card-itself">
</div>
</template>

<script>
export default {
  name: 'whitecard'
}
</script>

<style scoped>
.card-itself{
  border-radius: 20px;
  border: solid 1px black;
  background-color: whitesmoke;
  /*max-width: 10em;
  max-height:15em;
  min-width: em;
  min-height:7.5em;
  margin: 1em;
  padding-top: 1%; !* 1:1 Aspect Ratio *!
  position: relative; !* If you want text inside of it *!*/
  position: relative;
  width: 12%;
  min-width: 8em;
  padding-top: 16%; /* 1:1 Aspect Ratio */
  height: 10em;
  box-sizing: border-box;
  display: block;
  margin-left: 1em;
  margin-right: 1em;
  margin-top: 1em;
  flex-shrink: 2;
}
</style>

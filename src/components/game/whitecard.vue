<template>
  <div class="card-itself" @click="toggleCardClicked" :class="{selected:this.selected }">
    <p class="card-text">{{ cardData.text }}</p>
  </div>
</template>

<script>
export default {
  name: 'whitecard',
  props: [
    'cardData',
    'cardKey'

  ],
  data: function () {
    return { selected: false }
  },
  methods: {
    toggleCardClicked () {
      // things
      this.selected = !this.selected
      this.$emit('cardclicked', this.cardKey)
    }
  }
}
</script>

<style scoped>
.selected{
  /*border-color: blue !important;*/
  box-shadow: 5px 5px 5px 2px #0e0e0e;
  background-color: #eaeaea !important;
}
.card-text {
  position: absolute;
  top: 0;
  text-align: center;
  width: 100%;
  font-weight: bold;
  color: #18182b;
  padding: 5%;
  box-sizing: border-box;
}

.card-itself {
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
  width: 10%;
  min-width: 8em;
  padding-top: 14%; /* Aspect Ratio */
  height: 10em;
  box-sizing: border-box;
  display: block;
  margin-left: 1em;
  margin-right: 0.9em;
  margin-top: 1em;
  flex-shrink: 2;
}
</style>

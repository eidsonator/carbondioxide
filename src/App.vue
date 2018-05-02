<template>
  <div id="app" class="content">
    <router-view/>
  </div>
</template>

<script>
import SamplesStore from './stores/SamplesStore.js';

export default {
  name: 'App',
  created() {
    SamplesStore.startPoller();
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

<template>
  <div>

    {{ filepath }}<br>
    <input id="file" type="file" @change="save()">
    <br>

    <label>Lines offset</label>
    <input v-model="linesOffset" @cange="saveOffset()">
    <br>
    <router-link v-bind:to="'/'">Done</router-link>
  </div>
</template>

<script>
const settings = window.require('electron').remote.require('electron-settings');
export default {
  name: "Config",
  data() {
    return {
      filepath: settings.get('filepath'),
      linesOffset: settings.get('linesOffset', 4)
    };
  },
  methods: {
    save: function() {
      let fileName = document.getElementById('file').files[0].path;
      settings.set('filepath', fileName);
      this.filepath = settings.get('filepath')
    },
    saveOffset: function() {
      settings.set('linesOffset', this.linesOffset);
    }
  },
  Created() {
      this.filepath = settings.get('filepath')
  }
};
</script>

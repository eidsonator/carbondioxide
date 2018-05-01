<template>
  <div>
    <h3>Current Read File:</h3>
    {{ filepath }}<br>
    <h3>Change Read File:</h3>
    <input id="file" type="file" @change="save()">
    <br>
    <h3>Settings</h3>
    <label>Lines offset</label>
    <input v-model="linesOffset" @cange="saveOffset()">
    <br>
    <hr>
    <button @click="clickDone">Done</button>
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
    },
    clickDone: function() {
      this.$router.push({name: 'Collect'});
    }
  },
  Created() {
      this.filepath = settings.get('filepath')
  }
};
</script>

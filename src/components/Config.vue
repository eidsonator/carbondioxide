<template>
  <div>
    <h3>Current Read File:</h3>
    {{ filepath }}<br>
    <h3>Change Read File:</h3>
    <input id="file" type="file" @change="save()">
    <br>
    <h3>Export Directory</h3>
    {{ exportDirectory }}<br>
    <input id="exportDirectory" type="file" webkitdirectory @change="setDirectory">

    <h3>Advanced Settings</h3>
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
      exportDirectory: settings.get('exportDirectory'),
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
    setDirectory: function() {
      let exportDirectory = document.getElementById('exportDirectory').files[0].path;
      settings.set('exportDirectory', exportDirectory);
      this.exportDirectory = settings.get('exportDirectory')
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

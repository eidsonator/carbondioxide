<template>
  <div>
    <h3>Settings</h3>
    <div class="file has-name is-fullwidth">
      <label class="file-label">
        <input class="file-input" id="file" type="file" @change="save()">
        <span class="file-cta">
          <span class="file-icon">
            <i class="fas fa-upload"></i>
          </span>
          <span class="file-label">
            Read from file:
          </span>
        </span>
        <span class="file-name">
          {{ filepath }}
        </span>
      </label>
    </div>

    <div class="file has-name is-fullwidth">
      <label class="file-label">
        <input class="file-input" id="exportDirectory" type="file" webkitdirectory @change="setDirectory">
        <span class="file-cta">
          <span class="file-icon">
            <i class="fas fa-upload"></i>
          </span>
          <span class="file-label">
            Export directory:
          </span>
        </span>
        <span class="file-name">
          {{ exportDirectory }}
        </span>
      </label>
    </div>

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

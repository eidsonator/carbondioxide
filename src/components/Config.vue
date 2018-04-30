<template>
  <div>

    {{ filepath }}<br>
    <input id="file" type="file" @change="save()">
    <br>

    <router-link v-bind:to="'/'">Done</router-link>
  </div>
</template>

<script>
const settings = window.require('electron-settings');
export default {
  name: "Config",
  data() {
    return {
      filepath: settings.get('filepath')
    };
  },
  methods: {
    save: function() {
      let fileName = document.getElementById('file').files[0].path;
      settings.set('filepath', fileName);
      this.filepath = settings.get('filepath')
    }
  },
  Created() {
      this.filepath = settings.get('filepath')
  }
};
</script>

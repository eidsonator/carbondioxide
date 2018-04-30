<template>
  <div>

    {{ filepath }}
    <input id="file" type="file" @change="save()">
    <br>

    <router-link v-bind:to="'/'">Done</router-link>
  </div>
</template>

<script>
const settings = window.require('electron-settings')
const { exec } = window.require('child_process');
const { remote } = window.require ('electron');
const path = window.require ('path');


export default {
  name: "Tests",
  data() {
    return {
      filepath: null
    };
  },
  methods: {
    save: function() {
      let execPath = path.dirname(remote.process.execPath);
      let fileName = document.getElementById('file').files[0].path;
      let filewrite =  execPath + '/../../../test/filewriter.js'
      exec('node ' + filewrite + ' ' + fileName);

      // settings.set('filepath', fileName);
      // this.filepath = settings.get('filepath')
      this.$router.push('/');
    }
  },
  Created() {
      this.filepath = settings.get('filepath')
  }
};
</script>

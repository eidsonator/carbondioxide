`<template>
  <div>
    <div class="columns">
      <div class="column"></div>
      <div class="column box">
        <h3>Settings</h3>

          <div class="field is-horizontal">
            <div class="field-body">
              <div class="field is-expanded">
                <div class="field has-addons">
                  <p class="control">
                    <a class="button is-static" style="width: 175px;">
                      COM:
                    </a>
                  </p>
                  <p class="control is-expanded">
                    <select class="input" v-model="comName">
                      <option v-for="port in ports" v-bind:value="port.comName">
                        {{ port.manufacturer }}
                      </option>
                    </select>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr>
          <div class="file has-name is-fullwidth is-primary">
          <label class="file-label">
            <input class="file-input" id="exportDirectory" type="file" webkitdirectory @change="setDirectory">
            <span class="file-cta" style="width: 175px;">
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
      </div>
      <div class="column"></div>
    </div>

    <hr>
    <button class="button is-primary" @click="clickDone">Done</button>
  </div>
</template>

<script>
const settings = window.require("electron").remote.require("electron-settings");
const serialport = window.require("electron").remote.require("serialport");

export default {
  name: "Config",
  data() {
    return {
      ports: null,
      comName: settings.get("comName", null),
      exportDirectory: settings.get("exportDirectory"),
      linesOffset: settings.get("linesOffset", 4)
    };
  },
  beforeCreate() {
    serialport.list((err, ports) => {
      console.log("ports", ports);
      this.ports = ports;
    });
  },
  methods: {
    setDirectory: function() {
      let exportDirectory = document.getElementById("exportDirectory").files[0]
        .path;
      settings.set("exportDirectory", exportDirectory);
      this.exportDirectory = settings.get("exportDirectory");
    },
    clickDone: function() {
      settings.set("linesOffset", this.linesOffset);
      settings.set("comName", this.comName);
      this.$router.push({ name: "Collect" });
    }
  },
  Created() {
    this.filepath = settings.get("filepath");
  }
};
</script>

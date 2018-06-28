<template>
  <div>
    <h1>{{ state.message }} sample {{ state.sampleNumber }}</h1>
    Room Pressure: {{ state.ambientPressure }}

    <div class="columns">
      <div class="column">
        <div class="is-flex" style="justify-content: center">
          <table class="table">
            <tr>
              <th>Date</th><td>{{ state.currentRead.System_Date }}</td>
            </tr>
            <tr>
              <th>CO<sub>2</sub></th><td>{{ state.currentRead.CO2 }}</td>
            </tr>
            <tr>
              <th>Cell Temp</th><td>{{ state.currentRead.Cell_Temperature }}</td>
            </tr>
            <tr>
              <th>Pressure</th><td>{{ state.currentRead.CellPressure }}</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="column">
        <div class="is-flex" style="justify-content: center">
          <co2-chart
            :data="state.co2ChartData" ref='co2Chart'
            :options="{fill: false, pointRadius: 0}"></co2-chart>
        </div>
      </div>
      <div class="column ">
        <div class="is-flex" style="justify-content: center">
          <co2-chart
            :data="state.pressureChartData" ref='pressureChart'
            :options="{maintainAspectRatio: false, fill: false, pointRadius: 0}"></co2-chart>
        </div>
      </div>
    </div>
    <div class="columns">
      <div class="column"></div>
      <div class="column is-two-thirds">
        <h2>Samples</h2>
        <table class="table">
          <tr>
            <th>Sample</th>
            <th>Carbon</th>
          </tr>
          <tr v-for="sample in state.samples" v-bind:key="sample.number">
            <td>{{ sample.number }}</td>
            <td>{{ sample.carbon }}</td>
          </tr>
          <tfoot>
            <tr>
              <td colspan="99" align="center">
                <form @submit.prevent="clickExport()">
                  <div class="field has-addons">
                    <div class="control" style="width: 256px">
                      <input type="date" class="input" v-model="exportDate" placeholder="Sample Date" required>
                    </div>
                    <div class="control" style="width: 128px">
                      <input class="input" v-model="exportTray" placeholder="Tray" required>
                    </div>
                    <div class="control" style="width: 128px">
                      <select class="input" v-model="exportType" required>
                        <option value="" selected>Select Type</option>
                        <option value="H">Health</option>
                        <option value="N">N-min</option>
                      </select>
                    </div>
                    <div class="control">
                      <button class="button is-primary">Export</button>
                    </div>
                  </div>
                </form>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="column"></div>
    </div>

        <br>


    <button class="button is-primary" @click="clickStart()">Start</button>
    <button class="button" @click="clickConfig()">Config</button>
    <button class="button is-danger" @click="clickSkip()">Skip Sample</button>
  </div>
</template>

<script>
import SamplesStore from "../stores/SamplesStore.js";
import Co2Chart from "./Co2Chart";

const settings = window.require("electron").remote.require("electron-settings");

export default {
  name: "Collect",
  components: {
    Co2Chart: Co2Chart
  },
  data() {
    return {
      state: SamplesStore.state,
      pressureChartData: SamplesStore.state.pressureChartData.datasets[0].data,
      exportTray: "",
      exportType: "",
      exportDate: "",
      numberOfSamples: null
    };
  },
  watch: {
    pressureChartData: function() {
      this.$refs.co2Chart.update();
      this.$refs.pressureChart.update();
    }
  },
  methods: {
    clickConfig: function() {
      this.$router.push({ name: "Config" });
    },
    clickSkip: function() {
      SamplesStore.skipSample();
    },
    clickExport: function() {
      SamplesStore.writeFile(this.exportDate, this.exportTray, this.exportType);
      this.exportTray = "";
      this.exportType = "";
      this.exportDate = "";
    },
    clickStart: function() {
      SamplesStore.startPoller();
    }
  }
};
</script>

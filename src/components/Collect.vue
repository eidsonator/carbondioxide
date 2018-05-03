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
              <th>Time</th><td>{{ state.currentRead.System_Time }}</td>
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
            <tr>
              <th>Flow Rate</th><td>{{ state.currentRead.Flow_Rate }}</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="column">
        <div class="is-flex" style="justify-content: center">
          <co2-chart
            :data="state.co2ChartData" ref='co2Chart'
            :options="{responsive: false, maintainAspectRatio: false, fill: false, pointRadius: 0}"
            :width="400"
            :height="200"></co2-chart>
        </div>
      </div>
      <div class="column ">
        <div class="is-flex" style="justify-content: center">
          <co2-chart
            :data="state.pressureChartData" ref='pressureChart'
            :options="{responsive: false, maintainAspectRatio: false, fill: false, pointRadius: 0}"
            :width="400"
            :height="200"></co2-chart>
        </div>
      </div>
    </div>

    <h2>Samples</h2>
    <table class="table">
      <tr>
        <th>Sample</th>
        <th>Date</th>
        <th>Time</th>
        <th>CO<sub>2</sub></th>
        <th>Cell Temp</th>
        <th>Pressure</th>
        <th>Flow Rate</th>
      </tr>
      <tr v-for="sample in state.samples" v-bind:key="sample.number">
        <td>{{ sample.number }}</td>
        <td>{{ sample.System_Date }}</td>
        <td>{{ sample.System_Time }}</td>
        <td>{{ sample.CO2 }}</td>
        <td>{{ sample.Cell_Temperature }}</td>
        <td>{{ sample.CellPressure }}</td>
        <td>{{ sample.Flow_Rate }}</td>
      </tr>
    </table>

    <label>Export File Name</label>
    <input v-model="exportFileName">
    <button @click="clickExport()">Export</button>
    <br>

    <button @click="clickConfig()">Config</button>
    <button @click="clickTest()">Test</button>
  </div>
</template>

<script>
import SamplesStore from '../stores/SamplesStore.js';
import Co2Chart from './Co2Chart';

const settings = window.require('electron').remote.require('electron-settings');


export default {
  name: "Collect",
  components: {
    'Co2Chart': Co2Chart
  },
  data() {
    return {
      state: SamplesStore.state,
      pressureChartData: SamplesStore.state.pressureChartData.datasets[0].data,
      exportFileName: null
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
      this.$router.push({name: 'Config'});
    },
    clickTest: function() {
      this.$router.push({name: 'Tests'});
    },
    clickExport: function() {
      SamplesStore.writeFile(this.exportFileName);
    }
  }
};
</script>

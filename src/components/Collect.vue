<template>
  <div>
    <h1>{{ message }} sample {{ sampleNumber }}</h1>
    Room Pressure: {{ ambientPressure }}

    <div class="columns">
      <div class="column">
        <div class="is-flex" style="justify-content: center">
          <table class="table">
            <tr>
              <th>Date</th><td>{{ currentRead.System_Date }}</td>
            </tr>
            <tr>
              <th>Time</th><td>{{ currentRead.System_Time }}</td>
            </tr>
            <tr>
              <th>CO<sub>2</sub></th><td>{{ currentRead.CO2 }}</td>
            </tr>
            <tr>
              <th>Cell Temp</th><td>{{ currentRead.Cell_Temperature }}</td>
            </tr>
            <tr>
              <th>Pressure</th><td>{{ currentRead.CellPressure }}</td>
            </tr>
            <tr>
              <th>Flow Rate</th><td>{{ currentRead.Flow_Rate }}</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="column">
        <div class="is-flex" style="justify-content: center">
          <co2-chart
            :data="co2ChartData" ref='co2Chart'
            :options="{responsive: false, maintainAspectRatio: false, fill: false, pointRadius: 0}"
            :width="400"
            :height="200"></co2-chart>
        </div>
      </div>
      <div class="column ">
        <div class="is-flex" style="justify-content: center">
          <co2-chart
            :data="pressureChartData" ref='pressureChart'
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
      <tr v-for="sample in samples">
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

import Co2Chart from './Co2Chart';
const settings = window.require('electron').remote.require('electron-settings');
export default {
  name: "Collect",
  components: {
    'Co2Chart': Co2Chart
  },
  data() {
    return {
      message: "Waiting for",
      sampleNumber: 1,
      samples: [],
      records: [],
      ambientPressure: 0,
      pressureDropFound: false,
      peakFound: false,
      sampleFound: false,
      lastRead: {},
      currentRead: {},
      downwardCarbonDioxideTrend: 0,
      ticks: 0,
      CO2Baseline: null,
      filepath: settings.get('filepath'),
      exportFileName: null,
      co2ChartData: {
        labels: [],
        datasets: [
          {
            label: 'CO2',
            backgroundColor: '#f87979',
            data: []
          }
        ]
      },
      pressureChartData: {
        labels: [],
        datasets: [
          {
            label: 'pressure',
            backgroundColor: '#0079f8',
            data: []
          }
        ]
      }
    };
  },
  methods: {
    createReadObject: function(line) {
      let obj = line.split(/\s+/);
      //to do throw error if unexpected format
      let val = {
        System_Date: obj[0],
        System_Time: obj[1],
        CO2: Number(obj[2]),
        Cell_Temperature: Number(obj[3]),
        CellPressure: Number(obj[4]),
        Flow_Rate: Number(obj[5])
      };
      return val;
    },
    saveSample: function() {
      let sample = this.currentRead;
      sample.number = this.sampleNumber;
      this.samples.push(sample);
    },
    updateCharts: function() {
      if (this.co2ChartData.datasets[0].data.length > 60) {
        this.co2ChartData.datasets[0].data.shift();
        this.pressureChartData.datasets[0].data.shift();
        this.co2ChartData.labels.shift();
        this.pressureChartData.labels.shift();
      }

      this.co2ChartData.labels.push(this.currentRead.System_Time);
      this.co2ChartData.datasets[0].data.push(this.currentRead.CO2);
      this.$refs.co2Chart.update();

      this.pressureChartData.labels.push(this.currentRead.System_Time);
      this.pressureChartData.datasets[0].data.push(this.currentRead.CellPressure);
      this.$refs.pressureChart.update();
    },
    clickConfig: function() {
      this.$router.push({name: 'Config'});
    },
    clickTest: function() {
      this.$router.push({name: 'Tests'});
    },
    clickExport: function() {
      //todo ensure that filename is input
      const path = window.require('electron').remote.require('path');
      const fs = window.require('electron').remote.require('fs');
      const seperator = path.sep;
      const endOfLine = window.require('electron').remote.require('os').EOL;
      let exportFile = settings.get('exportDirectory') + seperator + this.exportFileName;
      let data = "date, time, sample, co2, temp, pressure, rate" + endOfLine;
      fs.appendFileSync(exportFile, data);
      this.samples.forEach(function(sample) {
        data = `${sample.System_Date}, ${sample.System_Time}, ${sample.number}, ${sample.CO2}, ${sample.Cell_Temperature}, ${sample.CellPressure}, ${sample.Flow_Rate}${endOfLine}`;
        fs.appendFileSync(exportFile, data);
      });
      // to do exported notification!
      window.alert('Exported to ' + exportFile);
    }
  },
  created() {
    const fs = window.require("fs");
    // import fs from 'fs'
    const chokidar = window.require('electron').remote.require("chokidar");
    const readLastLines = window.require('electron').remote.require("read-last-lines");
    const os = window.require('os');
    const watcher = chokidar.watch(this.filepath);
    const linesOffset = settings.get('linesOffset', 4);
    watcher.on("change", () => {
      readLastLines.read(this.filepath, linesOffset).then(lines => {
        let line = lines.trim();
        this.lastRead = this.currentRead;
        this.currentRead = this.createReadObject(line);
        if(isNaN(this.currentRead.CO2)) {
          return;
        }
        this.updateCharts();

        if (!this.ambientPressure) {
          this.ambientPressure = this.currentRead.CellPressure;
          this.CO2Baseline = this.currentRead.CO2 * 1.1;
        }
        if (this.lastRead) {
          if (!this.pressureDropFound) {
            //the tubes have not been inserted yet
            let pressureDelta =
              this.ambientPressure - this.currentRead.CellPressure;
            if (pressureDelta > 5) {
              this.pressureDropFound = true;
              this.message= "CO2 building for";
            }
          } else if (!this.peakFound) {
            //still watching the CO2 climb
            if (this.lastRead.CO2 - this.currentRead.CO2 > 0) {
              this.downwardCarbonDioxideTrend++;
            }
            if (this.downwardCarbonDioxideTrend == 2) {
              this.peakFound = true;
              this.message = "Reading";
            }
          } else if (!this.sampleFound) {
            //we have a peak, waiting for sample
            this.ticks++;
            if (this.ticks == 10) {
              this.saveSample();
              this.sampleFound = true;
              this.message = "Completed";
            }
          } else {
            //waiting for CO2 to drop to ~room levels
            if (this.currentRead.CO2 < this.CO2Baseline) {
              // system is flused ready for next sample
              //reset everything
              this.ambientPressure = null;
              this.pressureDropFound = false;
              this.peakFound = false;
              this.sampleFound = false;
              this.downwardCarbonDioxideTrend = 0;
              this.ticks = 0;
              // increment our sample number
              this.sampleNumber++;
              this.message = "Waiting for";
            }
          }
        }
        console.log(this.currentRead);
      });
    });
  }
};
</script>

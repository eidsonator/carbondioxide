<template>
  <div>
    <h1>{{ message }} sample {{ sampleNumber }}</h1>
    <table class="table">
      <tr>
        <td>C02</td><td>{{ currentRead.CO2 }}</td>
      </tr>
        <td>Pressure</td><td>{{ currentRead.CellPressure }}</td>
    </table>
    Room Pressure: {{ ambientPressure }}

    <co2-chart
    :data="co2ChartData" ref='co2Chart'
    :options="{responsive: false, maintainAspectRatio: false}"
    :width="400"
    :height="200"></co2-chart>


    <router-link :to="'Config'">Config</router-link>
  </div>
</template>

<script>

import Co2Chart from './Co2Chart';
const settings = window.require('electron-settings');

export default {
  name: "Collect",
  components: {
    'Co2Chart': Co2Chart
  },
  data() {
    return {
      message: "Waiting for",
      sampleNumber: 1,
      records: [],
      ambientPressure: 0,
      pressureDropFound: false,
      peakFound: false,
      sampleNumber: 1,
      sampleFound: false,
      lastRead: {},
      currentRead: {},
      downwardCarbonDioxideTrend: 0,
      ticks: 0,
      CO2Baseline: null,
      filepath: settings.get('filepath'),
      co2ChartData: {
        labels: [],
        datasets: [
          {
            label: 'CO2',
            backgroundColor: '#f87979',
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
    }
  },
  created() {
    const fs = window.require("fs");
    // import fs from 'fs'
    const chokidar = window.require("chokidar");
    const readLastLines = window.require("read-last-lines");
    console.log("created");
    const watcher = chokidar.watch(this.filepath);
    watcher.on("change", () => {
      readLastLines.read(this.filepath, 2).then(lines => {
        let line = lines.split(/\r?\n/)[0];
        this.lastRead = this.currentRead;
        this.currentRead = this.createReadObject(line);
        if(isNaN(this.currentRead.CO2)) {
          return;
        }
        this.co2ChartData.labels.push(this.currentRead.System_Time);
        this.co2ChartData.datasets[0].data.push(this.currentRead.CO2);
        this.$refs.co2Chart.update();
        console.log(this.chartData);
        //this.chartData.push(this.currentRead.CO2);
        // data.push(this.currentRead);
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

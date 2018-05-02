const settings = window.require('electron').remote.require('electron-settings');
const fs = window.require("fs");
const chokidar = window.require('electron').remote.require("chokidar");
const readLastLines = window.require('electron').remote.require("read-last-lines");
const os = window.require('os');

export default {
  state: {
    sampleNumber: 3,
    samples: null,
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
  },
  saveSample() {
    let sample = this.currentRead;
    sample.number = this.sampleNumber;
    this.samples.push(sample);
  },
  updateCharts() {
    if (this.co2ChartData.datasets[0].data.length > 60) {
      this.co2ChartData.datasets[0].data.shift();
      this.pressureChartData.datasets[0].data.shift();
      this.co2ChartData.labels.shift();
      this.pressureChartData.labels.shift();
    }

    this.co2ChartData.labels.push(this.currentRead.System_Time);
    this.co2ChartData.datasets[0].data.push(this.currentRead.CO2);

    this.pressureChartData.labels.push(this.currentRead.System_Time);
    this.pressureChartData.datasets[0].data.push(this.currentRead.CellPressure);
  },
  startPoller() {
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


    console.log(this.state.sampleNumber)
  }
}

function createReadObject(line) {
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

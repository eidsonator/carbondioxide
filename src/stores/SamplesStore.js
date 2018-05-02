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
    let sample = this.state.currentRead;
    sample.number = this.state.sampleNumber;
    this.state.samples.push(sample);
  },
  updateCharts() {
    if (this.state.co2ChartData.datasets[0].data.length > 60) {
      this.state.co2ChartData.datasets[0].data.shift();
      this.state.pressureChartData.datasets[0].data.shift();
      this.state.co2ChartData.labels.shift();
      this.state.pressureChartData.labels.shift();
    }

    this.state.co2ChartData.labels.push(this.state.currentRead.System_Time);
    this.state.co2ChartData.datasets[0].data.push(this.state.currentRead.CO2);

    this.state.pressureChartData.labels.push(this.state.currentRead.System_Time);
    this.state.pressureChartData.datasets[0].data.push(this.state.currentRead.CellPressure);
  },
  startPoller() {
    const watcher = chokidar.watch(this.state.filepath);
    const linesOffset = settings.get('linesOffset', 4);
    watcher.on("change", () => {
      readLastLines.read(this.state.filepath, linesOffset).then(lines => {
        let line = lines.trim();
        this.state.lastRead = this.state.currentRead;
        this.state.currentRead = createReadObject(line);
        if(isNaN(this.state.currentRead.CO2)) {
          return;
        }
        this.updateCharts();

        if (!this.state.ambientPressure) {
          this.state.ambientPressure = this.state.currentRead.CellPressure;
          this.state.CO2Baseline = this.state.currentRead.CO2 * 1.1;
        }
        if (this.state.lastRead) {
          if (!this.state.pressureDropFound) {
            //the tubes have not been inserted yet
            let pressureDelta =
              this.state.ambientPressure - this.state.currentRead.CellPressure;
            if (pressureDelta > 5) {
              this.state.pressureDropFound = true;
              this.state.message= "CO2 building for";
            }
          } else if (!this.state.peakFound) {
            //still watching the CO2 climb
            if (this.state.lastRead.CO2 - this.state.currentRead.CO2 > 0) {
              this.state.downwardCarbonDioxideTrend++;
            }
            if (this.state.downwardCarbonDioxideTrend == 2) {
              this.state.peakFound = true;
              this.state.message = "Reading";
            }
          } else if (!this.state.sampleFound) {
            //we have a peak, waiting for sample
            this.state.ticks++;
            if (this.state.ticks == 10) {
              this.saveSample();
              this.state.sampleFound = true;
              this.state.message = "Completed";
            }
          } else {
            //waiting for CO2 to drop to ~room levels
            if (this.state.currentRead.CO2 < this.state.CO2Baseline) {
              // system is flused ready for next sample
              //reset everything
              this.state.ambientPressure = null;
              this.state.pressureDropFound = false;
              this.state.peakFound = false;
              this.state.sampleFound = false;
              this.state.downwardCarbonDioxideTrend = 0;
              this.state.ticks = 0;
              // increment our sample number
              this.state.sampleNumber++;
              this.state.message = "Waiting for";
            }
          }
        }
        console.log(this.state.currentRead);
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

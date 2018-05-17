const settings = window.require('electron').remote.require('electron-settings');
const fs = window.require("fs");
const os = window.require('os');
const endOfLine = os.EOL;
const path = window.require('path');
const seperator = path.sep;
const serialport = window.require('electron').remote.require("serialport");

import Vue from 'vue';

export default {
  state: {
    port: null,
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
    exportFileName: null,
    co2ChartData: {
      labels: [],
      datasets: [{
        label: 'CO2',
        backgroundColor: '#f87979',
        data: []
      }]
    },
    pressureChartData: {
      labels: [],
      datasets: [{
        label: 'pressure',
        backgroundColor: '#0079f8',
        data: []
      }]
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
  writeFile(exportFileName) {
    //todo ensure that filename is input

    let exportFile = settings.get('exportDirectory') + seperator + exportFileName;
    if (fs.existsSync(exportFile)) {
      fs.truncateSync(exportFile);
    }

    let data = "date, time, sample, co2, temp, pressure, rate" + endOfLine;
    fs.appendFileSync(exportFile, data);
    this.state.samples.forEach(function (sample) {
      data = `${sample.System_Date}, ${sample.System_Time}, ${sample.number}, ${sample.CO2}, ${sample.Cell_Temperature}, ${sample.CellPressure}, ${sample.Flow_Rate}${endOfLine}`;
      fs.appendFileSync(exportFile, data);
    });
    // to do exported notification!
    window.alert('Exported to ' + exportFile);
  },
  analyzePressureDrop() {
    //the tubes have not been inserted yet
    let pressureDelta =
      this.state.ambientPressure - this.state.currentRead.CellPressure;
    if (pressureDelta > 5) {
      this.state.pressureDropFound = true;
      this.state.message = "CO2 building for";
    }
  },
  lookForPeak() {
    //still watching the CO2 climb
    if (this.state.lastRead.CO2 - this.state.currentRead.CO2 > 0) {
      this.state.downwardCarbonDioxideTrend++;
    }
    if (this.state.downwardCarbonDioxideTrend == 2) {
      this.state.peakFound = true;
      this.state.message = "Reading";
    }
  },
  lookForSample() {
    //we have a peak, waiting for sample
    this.state.ticks++;
    if (this.state.ticks == 10) {
      this.saveSample();
      this.state.sampleFound = true;
      this.state.message = "Completed";
    }
  },
  lookForReset() {
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

      this.state.sampleNumber++;
      this.state.message = "Waiting for";
    }

  },
  waitingForPressureDrop() {
    return !this.state.pressureDropFound;
  },
  waitingForPeak() {
    return !this.state.peakFound;
  },
  waitingForSample() {
    return !this.state.sampleFound;
  },
  analyze() {
    if (this.waitingForPressureDrop()) {
      this.analyzePressureDrop();
    } else if (this.waitingForPeak()) {
      this.lookForPeak();
    } else if (this.waitingForSample()) {
      this.lookForSample();
    } else {
      this.lookForReset();
    }
  },
  processData(data) {
    this.state.lastRead = this.state.currentRead;
    this.state.currentRead = createReadObject(data);
    if (isNaN(this.state.currentRead.CO2)) {
      return;
    }
    this.updateCharts();

    if (!this.state.ambientPressure) {
      this.state.ambientPressure = this.state.currentRead.CellPressure;
      this.state.CO2Baseline = this.state.currentRead.CO2 * 1.1;
    }
    if (this.state.lastRead) {
      this.analyze();
    }

  },
  startPoller() {
    let xml = `
    <li830>
      <cfg>
        <outrate>1</outrate>
      </cfg>
      <rs232>
        <co2>true</co2>
        <flowrate>false</flowrate>        
        <celltemp>true</celltemp>
        <cellpres>true</cellpres>
        <ivolt>false</ivolt>
        <co2abs>false</co2abs>        
        <raw>false</raw>
        <echo>false</echo>
        <strip>false</strip>
      </rs232>
    </li830>
    `;
    let usb = settings.get('comName');
    this.port = new serialport(usb, {
        baudRate: 9600
    });
    const parsers = serialport.parsers;
    let self = this;
    this.port.on("open", function() {
        self.port.write(xml);
        delay(1000);
        const parser = self.port.pipe(new parsers.Regex({
            regex: /<\/li830>/
        }));
        parser.on('data', function (data) {
            console.log(data);
        });
    });
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

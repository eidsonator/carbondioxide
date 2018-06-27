const settings = window.require('electron').remote.require('electron-settings');
const fs = window.require("fs");
const os = window.require('os');
const endOfLine = os.EOL;
const path = window.require('path');
const seperator = path.sep;
const serialport = window.require('electron').remote.require("serialport");
const xmlParse = window.require('electron').remote.require('xml2js').parseString;



import Vue from 'vue';

export default {
  state: {
    port: null,
    samples: null,
    message: "Start",
    sampleNumber: 0,
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
    let carbon = null;
    if (sample.number == 0) {
      carbon = 0;
    } else {
      let baseCo2 = this.state.samples[0].CO2;

      let pA = sample.CellPressure * .0098;
      let temp = sample.Cell_Temperature + 273.15;
      let V = 14.5;
      let R = 82.05;
      let n = (pA * V) / (R * temp);
      let co2 = sample.CO2 - baseCo2;

      carbon = n * co2 * 12;
    }
    sample.carbon = carbon;
    this.state.samples.push(sample);
  },
  updateCharts() {
    if (this.state.co2ChartData.datasets[0].data.length > 60) {
      this.state.co2ChartData.datasets[0].data.shift();
      this.state.pressureChartData.datasets[0].data.shift();
      this.state.co2ChartData.labels.shift();
      this.state.pressureChartData.labels.shift();
    }

    this.state.co2ChartData.labels.push(this.state.currentRead.System_Date);
    this.state.co2ChartData.datasets[0].data.push(this.state.currentRead.CO2);

    this.state.pressureChartData.labels.push(this.state.currentRead.System_Date);
    this.state.pressureChartData.datasets[0].data.push(this.state.currentRead.CellPressure);
  },
  writeFile(exportFileName) {
    //todo ensure that filename is input

    let exportFile = settings.get('exportDirectory') + seperator + exportFileName;
    if (fs.existsSync(exportFile)) {
      fs.truncateSync(exportFile);
    }

    let data = "date, sample, co2, temp, pressure, carbon" + endOfLine;
    fs.appendFileSync(exportFile, data);
    this.state.samples.forEach(function (sample) {
      data = `${sample.System_Date}, ${sample.number}, ${sample.CO2}, ${sample.Cell_Temperature}, ${sample.CellPressure}, ${sample.carbon}${endOfLine}`;

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
      this.state.message = "Reading";
    }
  },
  lookForSample() {
    //we have a peak, waiting for sample
    this.state.ticks++;
    if (this.state.ticks == 45) {
      this.saveSample();
      this.state.sampleFound = true;
      this.state.message = "Completed";
    }
  },
  lookForReset() {
    //waiting for CO2 to drop to ~room levels
    if (this.state.currentRead.CO2 < 1000) {
      this.advanceSample();
    }
  },
  skipSample() {
    //save the bad sample
    let sample = this.state.currentRead;
    sample.number = this.state.sampleNumber;
    let carbon = null;
    sample.carbon = carbon;
    this.state.samples.push(sample);

    this.state.sampleFound = true;
    this.state.message = "Skipping";
  },
  advanceSample() {
    this.state.ambientPressure = null;
    this.state.pressureDropFound = false;
    this.state.peakFound = false;
    this.state.sampleFound = false;
    this.state.downwardCarbonDioxideTrend = 0;
    this.state.ticks = 0;

    this.state.sampleNumber++;
    this.state.message = "Start";

  },
  waitingForPressureDrop() {
    return !this.state.pressureDropFound;
  },
  waitingForSample() {
    return !this.state.sampleFound;
  },
  analyze() {
    if (this.waitingForPressureDrop()) {
      this.analyzePressureDrop();
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

    window.port = this.port;

    const parsers = serialport.parsers;
    let self = this;
    this.port.on('error', function (err) {
      window.alert('Error: ', err.message);
    })

    self.parser = self.port.pipe(new parsers.Delimiter({
      delimiter: '</li830>'
    }));

    self.port.write(xml, function (err) {
      if (err) {
        window.alert('Error on write: ', err.message);
      }

    });
    self.parser.on('data', function (data) {

      xml = data.toString() + '</li830>';
      xmlParse(xml, function (err, result) {
        if (result.li830.hasOwnProperty('data')) {
          self.processData(result.li830.data[0]);
        }

      });
    });
  }
}

function createReadObject(record) {

  //to do throw error if unexpected format

  return {
    System_Date: (new Date).toString(),
    CO2: Number(record.co2),
    Cell_Temperature: Number(record.celltemp[0]),
    CellPressure: Number(record.cellpres[0])
  };
}

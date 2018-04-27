const fs = require('fs');
const chokidar = require('chokidar');
const readLastLines = require('read-last-lines');
const watcher = chokidar.watch('test.txt');
const jquery = require('jquery');
const popper = require('popper.js');
const bootsrap = require('bootstrap');

require('bootstrap/dist/css/bootstrap.min.css');

let ambientPressure = null;
let pressureDropFound = false;
let peakFound = false;
let sampleNumber = 1;
let sampleFound = false;
let lastRead = null;
let currentRead = null;
let data = [];
let downwardCarbonDioxideTrend = 0;
let ticks = 0;
let CO2Baseline = null;

watcher.on('change', (event, path, details) => {
    readLastLines.read('test.txt', 2)
        .then((lines) => {
            let line = lines.split(/\r?\n/)[0];
            lastRead = currentRead;
            currentRead = createReadObject(line);
            data.push(currentRead);
            if (!ambientPressure) {
                ambientPressure = currentRead.Cell_Pressure;
                CO2Baseline = currentRead.C02 * 1.1;
            }
            if (lastRead) {
                if (!pressureDropFound) { //the tubes have not been inserted yet
                    let pressureDelta = ambientPressure - currentRead.Cell_Pressure;
                    if (pressureDelta > 5) {                        
                        pressureDropFound = true;                        
                    }
                } else if (!peakFound) { //still watching the CO2 climb
                    if (lastRead.CO2 - currentRead.C02 < 0) {
                        downwardCarbonDioxideTrend++;
                    }
                    if (downwardCarbonDioxideTrend == 3) {
                        // we have 3 readings in a row that the carbon is dropping
                        peakFound = true;
                    }
                } else if (!sampleFound){ //we have a peak, waiting for sample
                    ticks++;
                    if (ticks == 10) {
                        sampleFound = true;
                    }
                } else { //waiting for C02 to drop to ~room levels
                    if (currentRead.CO2 < CO2Baseline) {
                        // system is flused ready for next sample
                        //reset everything
                        ambientPressure = null;
                        pressureDropFound = false;
                        peakFound = false;
                        sampleFound = false;
                        downwardCarbonDioxideTrend = 0;
                        ticks = 0;
                        // increment our sample number
                        sampleNumber++;
                    }
                }
            }
            console.log(currentRead)}
        );
});

function createReadObject(line) {
    let obj = line.split( /\s+/);
    let val = {
        "System_Time": obj[0],
        "CO2":  Number(obj[2]),
        "Cell_Temperature":  Number(obj[2]),
        "Cell_Pressure":  Number(obj[3]),
        "Flow_Rate":  Number(obj[4])
    };
    return val;
}

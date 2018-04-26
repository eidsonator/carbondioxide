const fs = require('fs');
const chokidar = require('chokidar');
const readLastLines = require('read-last-lines');
const watcher = chokidar.watch('test.txt');
const jquery = require('jquery');
const popper = require('popper.js');
const bootsrap = require('bootstrap');



let ambientPressure = null;
let pressureDrop = false;
let peak = false;
let sampleNumber = 1;
let lastRead = null;
let currentRead = null;

watcher.on('change', (event, path, details) => {
    readLastLines.read('test.txt', 2)
        .then((lines) => {
            let line = lines.split(/\r?\n/)[0];
            lastRead = currentRead;
            currentRead = createReadObject(line);
            if (!ambientPressure) {
                ambientPressure = currentRead.Cell_Pressure;
            }
            if (lastRead) {
                if (!pressureDrop) {
                    let pressureDelta = ambientPressure - currentRead.Cell_Pressure;
                    if (pressureDelta > 10) {
                        console.log("Pressure Drop");
                        pressureDrop = true;
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

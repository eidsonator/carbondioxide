const path = require('path');
const fs = require('fs');
testFile = __dirname + path.sep + 'test.txt';

fs.truncateSync(testFile);
const endOfLine = require('os').EOL;

console.log(process.argv[2]);
fs.readFile(process.argv[2], 'ascii', function(err, data) {
    let lines = data.split(/\r?\n/);
    let numberOfLines = lines.length;
    let count = 0;

    console.log(__dirname);
    interval = setInterval(function(){
        let data = lines[count++] + lines[count++] + endOfLine + endOfLine;
        fs.appendFileSync(testFile, data);
        if (count >= numberOfLines - 2) {
            clearInterval(interval);
        }
    }, 1000);
});

const fs = require('fs');
fs.truncateSync('test.txt');
fs.readFile('4oz.txt', 'ascii', function(err, data) {	
    let lines = data.split(/\r?\n/);
    let numberOfLines = lines.length;
    let count = 0;
    interval = setInterval(function(){        
        let data = lines[count++] + lines[count++] + '\r\n\r\n';
        fs.appendFileSync('test.txt', data);
        if (count >= numberOfLines - 2) {
            clearInterval(interval);
        }
    }, 1000);    
});
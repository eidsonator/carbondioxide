fs = require('fs');
      fs.readFile('4.21.18 test.txt', 'ascii', function(err, data) {
        lines = data.split(/\r?\n/);
        mapped = lines.reduce(function(result, line){
          if(!line.includes("System")) {
            obj = line.split( /\s+/);
            obj[1] = Number(obj[1]);
            obj[2] = Number(obj[2]);
            obj[3] = Number(obj[3]);
            obj[4] = Number(obj[4]);
            result.push(obj);
          }          
          return result;
        }, []);
        console.log(mapped);
      });
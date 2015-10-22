var getWords = require('./getwords.js');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'aa121unjjx7r1pz.cwczbkmzwby7.us-west-2.rds.amazonaws.com',
  user     : process.env.database_user,
  password : process.env.database_password,
  port     : '3306',
  database : 'twitterdata',
});

function calcHistogram() {
    connection.query('select text from streamdata', function (err, result) {
        if (!err) {
            var histogram = {};
            for (var i = 0; i < result.length; i++) {
                var text = result[i].text;
                var words = getWords(text);
                for (var j = 0; j < words.length; j++) {
                    var word = words[j];
                    if (word in histogram) {
                        histogram[word] += 1;
                    } else {
                        histogram[word] = 1;
                    }
                }
            }

            var tuples = [];
            for (var key in histogram) {
                tuples.push([key, histogram[key]])
            };
            tuples.sort(function (x, y) {
                return y[1] - x[1];
            });

            var tops = [];
            for (var i = 0; i < Math.min(20, tuples.length); i++){
                tops.push(tuples[i]);
            }
            console.log(JSON.stringify(tops));
        }
    });
    setTimeout(calcHistogram, 15*60*1000);
}
setTimeout(calcHistogram, 2000);
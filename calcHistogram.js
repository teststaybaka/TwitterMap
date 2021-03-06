var getWords = require('./getwords.js');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : process.env.database_endpoint,
  user     : process.env.database_user,
  password : process.env.database_password,
  port     : '3306',
  database : 'twitterdata',
});

function calcHistogram() {
    console.log('start calcHistogram');
    connection.query('select text from streamdata', function (err, result) {
        if (!err) {
            var histogram = {};
            for (var i = 0; i < result.length; i++) {
                var text = result[i].text;
                var words = getWords(text);
                for (var word in words) {
                    if (word in histogram) {
                        histogram[word] += 1;
                    } else {
                        histogram[word] = 1;
                    }
                }
                // if ('istanbul' in words) {
                //     console.log('worker istanbul:'+histogram['istanbul']+' '+text);
                // }
            }

            var tuples = [];
            for (var key in histogram) {
                tuples.push([key, histogram[key]])
            };
            tuples.sort(function (x, y) {
                return y[1] - x[1];
            });

            var tops = [];
            for (var i = 0; i < Math.min(15, tuples.length); i++){
                tops.push(tuples[i]);
            }
            console.log(JSON.stringify(tops));
        }
    });
    setTimeout(calcHistogram, 15*60*1000);
}
setTimeout(calcHistogram, 2000);
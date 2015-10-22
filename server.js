var http = require('http');
var fs = require('fs');
var WebSocketServer = require('ws').Server;
var background = require('./background.js');
var connection = background.connection;
var getWords = require('./getwords.js');

var static_path = /\/static\/(.*)/;
var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css"
};

function NotFound(response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.write('404 Not Found\n');
  response.end();
}

var server = http.createServer(function (request, response) {
  // console.log(request.url);
  if (request.url === '/') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    fs.readFile('./map.html', function (err, html) {
      if (err) {
        throw err;
      }
      response.write(html);
      response.end();
    });
  } else if (request.url === '/tweets') {
    response.writeHead(200, {'Content-Type': 'application/json'});
    connection.query('select text, longitude, latitude, lang, created_at, screen_name from streamdata', function (err, result) {
      if (err) {
        response.write(JSON.stringify({error: err}));
      } else {
        response.write(JSON.stringify(result));
      }
      response.end();
    });
  } else if (request.url === '/sample') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    connection.query('select * from streamdata limit 100', function (err, result) {
      if (err) {
        response.write('select:'+err);
      } else {
        response.write('<html><head><meta charset="UTF-8"></head><body><p>select:'+JSON.stringify(result)+'</p></body></html>');
      }
      response.end();
    });
  } else if (request.url === '/histogram') {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    connection.query('select text from streamdata', function (err, result) {
      if (err) {
        response.write('histogram error');
      } else {
        var histogram = {};
        console.log(result.length);
        for (var i = 0; i < result.length; i++) {
          var text = result[i].text;
          var words = getWords(text);
          console.log(words);
          for (var j = 0; j < words.length; j++) {
            var word = words[j];
            console.log(word);
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
        console.log(histogram)
        console.log(tuples)
        response.write('histogram:'+JSON.stringify(histogram)+'\n');
        response.write('histogram:'+JSON.stringify(tuples)+'\n');
      }
      response.end();
    });
  } else if (request.url === '/count') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    connection.query('select count(*) as total_tweets from streamdata', function (err, result) {
      if (err) {
        response.write('count:'+err);
      } else {
        response.write('<html><head><meta charset="UTF-8"></head><body><p>count:'+JSON.stringify(result)+'</p></body></html>');
      }
      response.end();
    });
  } else if (static_path.test(request.url)) {
    fs.readFile('.'+request.url, function (err, data) {
      if (err) {
        NotFound(response);
      } else {
        var parts = request.url.split('/');
        var suffix = parts[parts.length - 1].split('.')[1];
        var mimeType = mimeTypes[suffix];

        response.writeHead(200, {'Content-Type': mimeType});
        response.write(data);
        response.end();
      }
    });
  } else {
    NotFound(response);
  }
}).listen(process.env.PORT || 80);

var wss = new WebSocketServer({server: server});
wss.on('connection', function (ws) {
  // var location = url.parse(ws.upgradeReq.url, true);
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  // ws.on('message', function incoming(message) {
  //   console.log('received: %s', message);
  // });

  ws.send('something');
  console.log('WebSocket connection establish.');
});

wss.on('error', function (evt) {
  console.log('WebSocket error: '+evt)
})
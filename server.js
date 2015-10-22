var http = require('http');
var fs = require('fs');
var WebSocketServer = require('ws').Server;
var background = require('./background.js');
var connection = background.connection;

// http server:
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
    response.writeHead(200, {'Content-Type': 'text/html'});
    var word_reg = /([a-zA-Z]+)/g;
    var histogram = {};
    connection.query('select text from streamdata', function (err, result) {
      for (var i = 0; i < result.length; i++) {
        var text = result[i].text;
        var words = text.match(word_reg);
        for (var j = 0; j < words.length; j++) {
          if (words[j] in histogram) {
            histogram[words[j]] += 1;
          } else {
            histogram[words[j]] = 1;
          }
        }
      }
      response.write('<html><head><meta charset="UTF-8"></head><body><p>count:'+JSON.stringify(histogram)+'</p></body></html>');
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
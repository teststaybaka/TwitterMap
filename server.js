var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var WebSocketServer = require('ws').Server;
var publisher = require('./publisher.js');
var connection = publisher.connection;
var mysql = publisher.mysql;

var static_path = /\/static\/(.*)/;
var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "gif": 'image/gif',
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
    connection.query('select text, longitude, latitude, lang, created_at, screen_name, image_url, score from streamdata where score is not null', function (err, result) {
      if (err) {
        response.write(JSON.stringify({error: err}));
      } else {
        response.write(JSON.stringify({tweets: result}));
      }
      response.end();
    });
  } else if (request.url === '/sample') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    connection.query('select * from streamdata order by timestamp_ms desc limit 100', function (err, result) {
      if (err) {
        response.write('select:'+err);
      } else {
        response.write('<html><head><meta charset="UTF-8"></head><body><p>select:'+JSON.stringify(result)+'</p></body></html>');
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
  } else if (request.url === '/new_tweet') {
    console.log(request.headers);
    var params = '';
    request.on('data', function(data) {
      params += data;

      if (params.length > 1e6) {
        response.writeHead(403, {'Content-Type': 'text/html'});
        response.end('done');
        request.connection.destroy();
      }
    });

    request.on('end', function() {
      // var params = querystring.parse(params);
      console.log(params);
      params = JSON.parse(params);
      message = JSON.parse(params.Message);

      connection.query('select text, longitude, latitude, lang, created_at, screen_name, image_url from streamdata where id='+mysql.escape(message.tweet_id), function(err, result) {
        if (err || result.length !== 1) {
          console.log('Invalid result from tweet id:'+message.tweet_id);
          response.writeHead(403, {'Content-Type': 'text/html'});
          // response.write(JSON.stringify({error: err}));
        } else {
          var tweet = result[0];
          tweet.score = message.score;
          broadcast_new_tweet(tweet);
          response.writeHead(200, {'Content-Type': 'text/html'});
        }
        response.end('done');
      });

      connection.query('update streamdata set score='+mysql.escape(message.score)+' where id='+mysql.escape(message.tweet_id), function(err, result) {
        if (err) {
          console.log('Update error');
          console.log(err);
          return
        }
        console.log('Updated successfully.')
        // console.log(result);
      })
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
}).listen(process.env.PORT || 80, function() {
  console.log(server.address());
});

var wss = new WebSocketServer({server: server});
wss.on('connection', function (ws) {
  // var location = url.parse(ws.upgradeReq.url, true);
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  // ws.on('message', function incoming(message) {
  //   console.log('received: %s', message);
  // });

  console.log('WebSocket connection established.');
});
wss.on('error', function (evt) {
  console.log('WebSocket error: '+evt)
});

function broadcast_new_tweet(tweet) {
  tweet = JSON.stringify(tweet);
  console.log('Broadcasting:'+tweet);
  wss.clients.forEach(function (client) {
    client.send(tweet);
  });
}

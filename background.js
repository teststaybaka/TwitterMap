var Twitter = require('twitter');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'aa121unjjx7r1pz.cwczbkmzwby7.us-west-2.rds.amazonaws.com',
  user     : process.env.database_user,
  password : process.env.database_password,
  port     : '3306',
  database : 'twitterdata',
});

connection.connect(function(err) {
  if (err) {
    console.log('error connecting:' + err.stack);
    return
  }

  console.log('connected as id ' + connection.threadId);
});

// create_table = 'create table streamdata (\
// id bigint unsigned primary key,\
// text varchar(255),\
// longitude double,\
// latitude double,\
// lang varchar(20),\
// timestamp_ms bigint,\
// created_at varchar(255),\
// user_id bigint,\
// screen_name varchar(25),
// image_url varchar(255),\
// location varchar(255),\
// )engine=InnoDB DEFAULT CHARSET=utf8'

// connection.query(create_table, function(err, result) {
//   console.log('create table: '+err+' '+result);
// })

//======================================================================================================================================================================================================================
// background process: loading twitter stream data into database
var client = new Twitter({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token_key: process.env.access_token_key,
  access_token_secret: process.env.access_token_secret,
});

client.stream('statuses/sample', function(stream) {
  stream.on('data', function(tweet) {
    // console.log(tweet);
    if (!tweet.delete && tweet.coordinates) {
      store_query = 'replace into streamdata (id, text, longitude, latitude, lang, timestamp_ms, created_at, user_id, screen_name, location) values '+
                  "("+mysql.escape(tweet.id)+", "+mysql.escape(tweet.text)+", "+mysql.escape(tweet.coordinates.coordinates[0])+", "+mysql.escape(tweet.coordinates.coordinates[1])+", "+mysql.escape(tweet.lang)+", "+mysql.escape(tweet.timestamp_ms)+", "+mysql.escape(tweet.created_at)+", "+mysql.escape(tweet.user.id)+", "+mysql.escape(tweet.user.screen_name)+", "+mysql.escape(tweet.user.location)+")"
      connection.query(store_query, function(err, result) {
        if (err) {
          console.log('replace query: '+err+' <--> '+JSON.stringify(result)+' <--> '+store_query)
        }
      });
    }
  });
 
  stream.on('error', function(error) {
    console.log('twitter stream error: '+error)
    // throw error;
  });
});

module.exports = {
    connection: connection,
}

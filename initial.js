var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : process.env.database_endpoint,
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

create_table = 'create table streamdata (\
id bigint unsigned primary key,\
text varchar(255),\
longitude double,\
latitude double,\
lang varchar(20),\
timestamp_ms bigint,\
created_at varchar(255),\
user_id bigint,\
screen_name varchar(25),\
image_url varchar(255),\
location varchar(255)\
) ENGINE=InnoDB DEFAULT CHARSET=utf8;'

connection.query(create_table, function(err, result) {
  console.log('create table: '+err+' '+result);
})
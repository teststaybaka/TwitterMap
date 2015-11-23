var events = require('events');
var AWS = require('aws-sdk');

var sqs = new AWS.SQS(options = {
    accessKeyId: process.env.aws_access_key_id,
    secretAccessKey: process.env.aws_secret_access_key,
    region: 'us-west-2',
});

sqs.createQueue({
    QueueName: 'TwitQueue'
}, function(err, data) {
    if (err) {
        console.log(err, err.stack);
        return;
    }
    var QueueUrl = data.QueueUrl;

    function LongPolling() {}
    LongPolling.prototype = new events.EventEmitter;
    LongPolling.prototype.receive = function() {
        var self = this;
        sqs.receiveMessage({
            QueueUrl: QueueUrl,
            VisibilityTimeout: 0,
            WaitTimeSeconds : 10,
        }, function(err, data) {
            self.emit('done');
            if (err) {
                console.log(err, err.stack);
                return;
            }
            if (!data.Messages) return;
            
            var messages = data.Messages;
            console.log('SQS received.');
            console.log(messages[0]);
            sqs.deleteMessage({
                QueueUrl: QueueUrl,
                ReceiptHandle: messages[0].ReceiptHandle,
            }, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    return;
                }
                console.log('SQS deleted.');
                console.log(data);
            });
        });
    }

    var longPolling = new LongPolling();
    longPolling.on('done', function() {
        longPolling.receive();
    });
    longPolling.receive();
});
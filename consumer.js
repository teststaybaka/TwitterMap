var AWS = require('aws-sdk');

var longPolling = function

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

    sqs.receiveMessage({
        QueueUrl: QueueUrl,
        VisibilityTimeout: 0,
        WaitTimeSeconds : 10,
    }, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            return;
        }
        if (!data.Messages) return;
        
        var messages = data.Messages;
        console.log(messages[0]);
        sqs.deleteMessage({
            QueueUrl: QueueUrl,
            ReceiptHandle: messages[0].ReceiptHandle,
        }, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                return;
            }
            console.log(data);
        });
    });
});
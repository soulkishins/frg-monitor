import { handler } from './main';

handler({
    "Records": [
      {
        "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
        "receiptHandle": "MessageReceiptHandle",
        "body": JSON.stringify({
            "key": "export_03_03_2025_4u4oa5irb0k.csv",
            "ids": [], //["9d6ca67b-b6ef-4353-826e-7055101c5a5e"],
            "user": "teste"
        }),
        "attributes": {
          "ApproximateReceiveCount": "1",
          "SentTimestamp": "1523232000000",
          "SenderId": "123456789012",
          "ApproximateFirstReceiveTimestamp": "1523232000001"
        },
        "messageAttributes": {},
        "md5OfBody": "{{{md5_of_body}}}",
        "eventSource": "aws:sqs",
        "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:MyQueue",
        "awsRegion": "us-east-1"
      }
    ]
})
.then(console.log)
.catch(console.error);
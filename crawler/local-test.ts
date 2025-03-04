import { handler } from './main';

handler({
    "Records": [
      {
        "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
        "receiptHandle": "MessageReceiptHandle",
        "body": JSON.stringify({
            "id_keyword": "f4270d79-ec23-4fa6-9047-d8bfacdf0690",
            "keyword": "Máscara Nutricurls Wella 150g",
            "idBrand": "8eb1907c-0da7-4a37-8406-4f5066b77690",
            "brandProducts": [
                {
                    "id_product": "d67caf98-f6a6-456c-b3b2-0237d177a386",
                    "st_varity_seq": "1",
                    "st_varity_name": "100ML"
                }
            ]
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
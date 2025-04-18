process.env.AWS_PROFILE = 'frg';
process.env.APP_REGION = 'sa-east-1';
process.env.DB_SCHEMA = 'pricemonitor';
process.env.RDS_SECRET_NAME = 'local/db/pricemonitor';
process.env.S3_BUCKET_NAME = 'frg-price-monitor-data';
process.env.SQS_QUEUE_URL = 'https://sqs.sa-east-1.amazonaws.com/147997132513/price-monitor-crawler-ai';
process.env.TZ = 'America/Sao_Paulo';

import { handler } from './main';

handler({
    "Records": [
      {
        "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
        "receiptHandle": "MessageReceiptHandle",
        "body": JSON.stringify({
          "scheduler_id": "ea01587c-d246-404c-b4b5-34255b3e3788",
          "cron": "15_15_0",
          "platform": "ML",
          "datetime": "2025-04-18 20:35:28",
          "keyword_id": "aa6fac64-1e6a-4dda-80c5-6c02c2f4457b",
          "keyword": "7897230305820",
          "brand_id": "7f510ac5-5442-46a2-9bfd-ec6b482fda40",
          "products": [
            {
              "id_product": "28c336c9-a6b0-4c2c-a9af-dc87f5046997",
              "st_varity_seq": 1,
              "st_varity_name": "5 g",
              "db_price": 12.4
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
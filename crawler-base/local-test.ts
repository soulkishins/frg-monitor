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
          "scheduler_id": " ",
          "cron": "40_18_7",
          "platform": "MAGALU",
          "datetime": "2025-05-23 23:00:00",
          "keyword_id": "d85b0d1c-07b4-4d0f-98ca-87cc5f060b29",
          "keyword": "Paris Elysees Perfume Caviar Intense",
          "brand_id": "06c11762-d384-4264-8051-1957b8a421ac",
          "products": [
              {
                  "id_product": "969892b9-4813-46d1-9028-c00e98dd7892",
                  "st_varity_seq": 8,
                  "st_varity_name": "Paris Elysees Perfume Caviar Intense ",
                  "db_price": 78.9
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
process.env.AWS_PROFILE = 'frg';
process.env.APP_REGION = 'sa-east-1';
process.env.DB_SCHEMA = 'pricemonitor';
process.env.RDS_SECRET_NAME = 'local/db/pricemonitor';
process.env.S3_BUCKET_NAME = 'frg-price-monitor-data';
process.env.TZ = 'America/Sao_Paulo';

import { handler } from './main';

handler({
    "Records": [
      {
        "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
        "receiptHandle": "MessageReceiptHandle",
        "body": JSON.stringify({
            "scheduler_id": "b3bd3c4d-7e6f-4500-9d3b-ab18d7c4911a",
            "cron": "55_22_0",
            "platform": "ML",
            "datetime": "2025-04-17 01:55:48",
            "keyword_id": "fda81d85-94f1-428f-85c1-0116246a3cc1",
            "keyword": "AMPOLA SUPER DOSE RECONSTRUÇÃO 15ML",
            "brand_id": "5512ab83-027f-45cf-bc8e-a92f0cc253ec",
            "products": [
                {
                    "id_product": "a0adeda9-e30a-4fef-8a08-39272b34cd9b",
                    "st_varity_seq": 1,
                    "st_varity_name": "15ML",
                    "db_price": 27.6
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
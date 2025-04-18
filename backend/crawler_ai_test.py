import os

os.environ['secret_region'] = 'sa-east-1'
os.environ['s3_region'] = 'sa-east-1'
os.environ['crawler_sqs_region'] = 'sa-east-1'
os.environ['scheduler_region'] = 'sa-east-1'
os.environ['user_pool_region'] = 'sa-east-1'
#os.environ['bedrock_region'] = 'sa-east-1'

os.environ['AWS_PROFILE'] = 'frg'
os.environ['secret_db'] = 'local/db/pricemonitor'
#os.environ['db_schema'] = 'pricemonitorhml'
os.environ['db_schema'] = 'pricemonitor'
os.environ['s3_name'] = 'frg-price-monitor-data'
os.environ['crawler_sqs'] = 'arn:aws:sqs:sa-east-1:147997132513:price-monitor-crawler-ml'
os.environ['scheduler_role_arn'] = 'arn:aws:iam::147997132513:role/service-role/PriceMonitorScheduler'
os.environ['scheduler_cron'] = 'cron(0 6 * * ? *)'
os.environ['user_pool_id'] = 'sa-east-1_Zzr6cAeru'

from crawler_ai import lambda_handler

result = lambda_handler(
   {
      "Records": [
         {
            #"body": "[\"0c250efc-337a-4d07-87e1-574d180c0492\"]"
            "body": "[\"00298bda-e59a-4c44-908e-e1a5ae845822\"]"
         }
      ]
   },
   None
)
print(result)

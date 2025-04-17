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
os.environ['crawler_sqs'] = 'https://sqs.sa-east-1.amazonaws.com/147997132513/price-monitor-crawler-ml'
os.environ['scheduler_role_arn'] = 'arn:aws:iam::147997132513:role/service-role/PriceMonitorScheduler'
os.environ['scheduler_cron'] = 'cron(0 6 * * ? *)'
os.environ['user_pool_id'] = 'sa-east-1_Zzr6cAeru'

if __name__ == "__main__":
   from crawler_start import lambda_handler

   result = lambda_handler(
      {
         "Records": [
            {
               "body": "{\"platform\": \"ML\", \"cron\": \"0_0_0\"}"
            }
         ]
      },
      None
   )
   print(result)

if __name__ == "__main1__":
   import boto3
   client = boto3.client('scheduler', region_name='sa-east-1')
   while True:
      response = client.list_schedules(
         State='ENABLED'
      )
      if len(response['Schedules']) == 0:
         break

      for schedule in response['Schedules']:
         print(schedule['Name'])
         client.delete_schedule(
            Name=schedule['Name']
         )

import os

os.environ['secret_region'] = 'sa-east-1'
os.environ['s3_region'] = 'sa-east-1'
os.environ['crawler_sqs_region'] = 'sa-east-1'
os.environ['scheduler_region'] = 'sa-east-1'
os.environ['user_pool_region'] = 'sa-east-1'

os.environ['AWS_PROFILE'] = 'frg'
os.environ['secret_db'] = 'local/db/pricemonitor'
#os.environ['db_schema'] = 'pricemonitorhml'
os.environ['db_schema'] = 'pricemonitor'
os.environ['s3_name'] = 'frg-price-monitor-data'
os.environ['crawler_sqs'] = 'arn:aws:sqs:sa-east-1:147997132513:price-monitor-crawler-start'
os.environ['scheduler_role_arn'] = 'arn:aws:iam::147997132513:role/service-role/PriceMonitorScheduler'
os.environ['user_pool_id'] = 'sa-east-1_Zzr6cAeru'

from crud import lambda_handler

result = lambda_handler(
    {
        "headers": {"Authorization": "e.eyJzdWIiOiI2M2RjYWFhYS04MDgxLTcwMDMtMjhjNC02N2RkNzA4OTY3NWQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnNhLWVhc3QtMS5hbWF6b25hd3MuY29tXC9zYS1lYXN0LTFfWnpyNmNBZXJ1IiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjpmYWxzZSwiY29nbml0bzp1c2VybmFtZSI6IjYzZGNhYWFhLTgwODEtNzAwMy0yOGM0LTY3ZGQ3MDg5Njc1ZCIsIm9yaWdpbl9qdGkiOiJmOTZmNGFlMC1kODlkLTQxZTEtOTUxYi1mNTRkNTAyMzVmOTQiLCJhdWQiOiIyaTMwbHFsaXFhZzRocnM0MWNtNGM2bWJwMCIsImV2ZW50X2lkIjoiZjdkOGY4MzctN2M0Ni00MzQ3LWI0ZGYtYTAzNTViZmRiNTIxIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3NDQ1OTMyMTYsIm5hbWUiOiJCcnVubyBBbnR1bmVzIiwicGhvbmVfbnVtYmVyIjoiKzU1MTE5MzMzMzQ1NjciLCJleHAiOjE3NDQ1OTY4MTYsImlhdCI6MTc0NDU5MzIxNiwianRpIjoiYTZiYzhkNGItMGU4Ny00NzMxLTljNzgtYThlY2ZiZTM3YjE4IiwiZW1haWwiOiJicnVuby5iYWNzQGdtYWlsLmNvbSJ9.u"},
        "httpMethod": "GET",
        "requestContext": {"operationName": "scheduler.setup_schedules"},
        "queryStringParameters": {},
        "body": "{}"
    },
    None
)
print(result)

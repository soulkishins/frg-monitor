import os
import json

os.environ['secret_region'] = 'sa-east-1'
os.environ['s3_region'] = 'sa-east-1'
os.environ['crawler_sqs_region'] = 'sa-east-1'
os.environ['scheduler_region'] = 'sa-east-1'
os.environ['user_pool_region'] = 'sa-east-1'

os.environ['AWS_PROFILE'] = 'frg'
os.environ['secret_db'] = 'local/db/pricemonitor'
os.environ['db_schema'] = 'pricemonitorhml'
# os.environ['db_schema'] = 'pricemonitor'
os.environ['s3_name'] = 'frg-price-monitor-data'
os.environ['crawler_sqs'] = 'arn:aws:sqs:sa-east-1:147997132513:price-monitor-crawler-start'
os.environ['scheduler_role_arn'] = 'arn:aws:iam::147997132513:role/service-role/PriceMonitorScheduler'
os.environ['user_pool_id'] = 'sa-east-1_Zzr6cAeru'

from crud import lambda_handler

result = lambda_handler(
    {
        "headers": {"Authorization": "e.eyJzdWIiOiI2M2RjYWFhYS04MDgxLTcwMDMtMjhjNC02N2RkNzA4OTY3NWQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnNhLWVhc3QtMS5hbWF6b25hd3MuY29tXC9zYS1lYXN0LTFfWnpyNmNBZXJ1IiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjpmYWxzZSwiY29nbml0bzp1c2VybmFtZSI6IjYzZGNhYWFhLTgwODEtNzAwMy0yOGM0LTY3ZGQ3MDg5Njc1ZCIsIm9yaWdpbl9qdGkiOiI0N2Q5N2U3My02Y2Q0LTQ1MTItYTkyMy1jYTJjOWFmZGE1ZDIiLCJhdWQiOiIyaTMwbHFsaXFhZzRocnM0MWNtNGM2bWJwMCIsImV2ZW50X2lkIjoiNTI0OTVjOTktYjhlYy00YmUxLWFmZWMtYTViZTA1MTM3MGNjIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3NDQ5NDAyMzIsIm5hbWUiOiJCcnVubyBBbnR1bmVzIiwicGhvbmVfbnVtYmVyIjoiKzU1MTE5MzMzMzQ1NjciLCJleHAiOjE3NDQ5NDM4MzIsImlhdCI6MTc0NDk0MDIzMiwianRpIjoiY2YxMzdkOGUtZDY3YS00NzUwLWJhOWMtN2UyNDEwNDk3NGYxIiwiZW1haWwiOiJicnVuby5iYWNzQGdtYWlsLmNvbSJ9.x"},
        "httpMethod": "GET",
        "requestContext": {"operationName": "advertisement_product.delete"},
        "pathParameters": {"advertisement": "0728bc33-6aa7-435d-b3b7-b5f1545ed284", "product": "0f1f939d-9b2d-4937-ad77-85d4e69dfbeb", "varity-seq": "1"},
        #"queryStringParameters": {"id_advertisement": "0728bc33-6aa7-435d-b3b7-b5f1545ed284"},
        # "body": json.dumps({
        #     "id_keyword": "3d034be9-6c90-488b-b8e8-4b36ce388f7a",
        #     "st_platform": "ML",
        #     "st_cron": "50_4_2-5,7"
        # })
    },
    None
)
print(json.dumps(result, indent=4, default=str))

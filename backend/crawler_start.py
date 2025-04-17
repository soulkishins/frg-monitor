from db.db import DB, set_current_user
from sqlalchemy.orm import Session
from sqlalchemy import text
import json
import traceback
import os
import boto3
from datetime import datetime
sqs_region = os.getenv('crawler_sqs_region')

def lookup_keywords(cron: dict):
    db = DB()
    set_current_user('crawler_starter')

    with db:
        session: Session = db.session

        stmt = text(
            "select " +
            "    sc.id, " +
            "    ke.id_keyword, " +
            "    ke.st_keyword, " +
            "    ke.id_brand, " +
            "    ke.st_product " +
            "from " +
            f"    {os.getenv('db_schema')}.tb_scheduler sc " +
            f"    join {os.getenv('db_schema')}.tb_keyword ke on " +
            "        sc.id_keyword = ke.id_keyword " +
            f"    left join {os.getenv('db_schema')}.tb_scheduler_statistics ss on " +
            "        sc.id  = ss.id_scheduler " +
            "        and sc.dt_last_execution = ss.dt_created " +
            "where " +
            "    sc.st_cron = :cron" +
            "    and sc.st_platform = :platform" +
            "    and ke.st_status = 'active'"
        )
        
        records = session.execute(stmt, cron).fetchall()
        
        client = boto3.client('sqs', region_name=sqs_region)
        
        for record in records:
            sqs_message = {
                "scheduler_id": str(record[0]),
                "cron": cron["cron"],
                "platform": cron["platform"],
                "datetime": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "keyword_id": str(record[1]),
                "keyword": record[2],
                "brand_id": str(record[3]),
                "products": json.loads(record[4])
            }
            
            client.send_message(
                QueueUrl=os.getenv('crawler_sqs'),
                MessageBody=json.dumps(sqs_message)
            )
        
        print(f"Mensagens processadas com sucesso: {len(records)}")

def lambda_handler(event, context):
    try:
        for record in event["Records"]:
            data = json.loads(record["body"])
            print(f"Mensagem recebida: {data}")
            lookup_keywords(data)

        return {"statusCode": 200, "body": "Mensagens processadas com sucesso"}
    except Exception as e:
        error_line = traceback.extract_tb(e.__traceback__)[-1].lineno
        return {"statusCode": 500, "body": json.dumps({"error": f"Erro na linha {error_line}: {str(e)}"})}

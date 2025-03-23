from operations.crud_base import Crud
from db.models import Keyword, ClientBrand, Client
from sqlalchemy.orm import contains_eager
import boto3
import json

import os

crawler_sqs = os.getenv('crawler_sqs')
scheduler_role_arn = os.getenv('scheduler_role_arn')
scheduler_cron = os.getenv('scheduler_cron')

class KeywordCrud(Crud):
    def get_model(self) -> Keyword:
        return Keyword
    
    def create(self, indexes, data) -> Keyword:
        created = super().create(indexes, data)
        if created and created.st_status != 'inactive':
            self._session.commit()
            self.create_schedule(indexes, {}, created)
        return created
    
    def update(self, indexes, data) -> Keyword:
        updated = super().update(indexes, data)
        if updated and updated.st_status != 'inactive':
            self.create_schedule(indexes, {}, updated)
        if updated and updated.st_status == 'inactive':
            self.delete_schedule(indexes)
        return updated
    
    def delete(self, indexes) -> tuple[int, dict]:
        deleted = super().delete(indexes)
        if deleted:
            self.delete_schedule(indexes)
        return deleted
    
    def get_joins(self, indexes, filters) -> list:
        return (Keyword.brand,)
    
    def get_options(self) -> list:
        return (contains_eager(Keyword.brand),)

    def filter_by_pk(self, indexes) -> list:
        return (Keyword.id_keyword == indexes['keyword'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'st_keyword' in filters and 'st_brand' in filters and 'st_client' in filters:
            where.append(
                (Keyword.st_keyword.ilike(f"%{filters['st_keyword']}%")) |
                (ClientBrand.st_brand.ilike(f"%{filters['st_brand']}%")) |
                (Client.st_name.ilike(f"%{filters['st_client']}%")) 
            )
        else:
            if 'brand' in indexes:
                where.append(Keyword.id_brand == indexes['brand'])
            if 'st_keyword' in filters:
                where.append(Keyword.st_keyword.ilike(f"%{filters['st_keyword']}%"))
            if 'st_product' in filters:
                where.append(Keyword.st_product.ilike(f"%{filters['st_product']}%"))
        if 'st_status' in filters:
            where.append(Keyword.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)
    
    def get_schedule(self, indexes, filters, body) -> tuple[int, dict]:
        # Inicializa o cliente do EventBridge Schedule
        client = boto3.client('scheduler', region_name='sa-east-1')

        # Busca Schedule
        response = client.get_schedule(Name=indexes['keyword'])

        return 200, response
    
    def create_schedule(self, indexes, filters, record) -> tuple[int, dict]:
        
        # Inicializa o cliente do EventBridge Schedule
        client = boto3.client('scheduler', region_name='sa-east-1')
           
        # Busca Schedule
        try:
            response = client.get_schedule(Name=str(record.id_keyword))
        except Exception as e:
            response = None
        
        if not response:
            # Cria Schedule
            response = client.create_schedule(
                    ActionAfterCompletion = "NONE",
                    Description = f'{record.st_keyword} - {record.st_product}',
                    FlexibleTimeWindow = { "Mode": "OFF" },
                    Name = str(record.id_keyword),
                    ScheduleExpression = scheduler_cron,
                    ScheduleExpressionTimezone = "America/Sao_Paulo",
                    State = "ENABLED",
                    Target = {
                        "Arn": crawler_sqs,
                        "Input": json.dumps(
                            {
                                "id_keyword": str(record.id_keyword),
                                "keyword": record.st_keyword,
                                "idBrand": str(record.id_brand),
                                "brandProducts": json.loads(record.st_product)
                            }
                        ),
                        "RetryPolicy": {
                            "MaximumEventAgeInSeconds": 86400,
                            "MaximumRetryAttempts": 0
                        },
                        "RoleArn": scheduler_role_arn
                    }
                )
        else:
            # Atualiza Schedule
            response = client.update_schedule(
                    ActionAfterCompletion = "NONE",
                    Description = f'{record.st_keyword} - {record.st_product}',
                    FlexibleTimeWindow = { "Mode": "OFF" },
                    Name = str(record.id_keyword),
                    ScheduleExpression = scheduler_cron,
                    ScheduleExpressionTimezone = "America/Sao_Paulo",
                    State = "ENABLED",
                    Target = {
                        "Arn": crawler_sqs,
                        "Input": json.dumps(
                            {
                                "id_keyword": str(record.id_keyword),
                                "keyword": record.st_keyword,
                                "idBrand": str(record.id_brand),
                                "brandProducts": json.loads(record.st_product)
                            }
                        ),
                        "RetryPolicy": {
                            "MaximumEventAgeInSeconds": 86400,
                            "MaximumRetryAttempts": 0
                        },
                        "RoleArn": scheduler_role_arn
                    }
                )

        return 200, response
    
    def delete_schedule(self, indexes) -> tuple[int, dict]:
        # Inicializa o cliente do EventBridge Schedule
        client = boto3.client('scheduler', region_name='sa-east-1')
        # Exclui o schedule
        try:
            client.delete_schedule(Name=indexes['keyword'])
        except Exception as e:
            print(f"Schedule não encontrado: {e}")
        # Retorna o status 200
        return 200, None

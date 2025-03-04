from operations.crud_base import Crud
from db.models import Keyword, ClientBrand
from sqlalchemy.orm import contains_eager
import boto3
import json

class KeywordCrud(Crud):
    def get_model(self) -> Keyword:
        return Keyword
    
    def get_joins(self, indexes, filters) -> list:
        return (Keyword.brand,)
    
    def get_options(self) -> list:
        return (contains_eager(Keyword.brand),)

    def filter_by_pk(self, indexes) -> list:
        return (Keyword.id_keyword == indexes['keyword'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

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
    
    def create_schedule(self, indexes, filters, body) -> tuple[int, dict]:
        record = self.read(indexes)
        if not record:
            return 404, []
        
        # Inicializa o cliente do EventBridge Schedule
        client = boto3.client('scheduler', region_name='sa-east-1')
        
        # Busca Schedule
        response = client.get_schedule(Name=indexes['keyword'])
        if not response:
            # Cria Schedule
            response = client.create_schedule(
                    ActionAfterCompletion = "NONE",
                    Description = f'{record.st_keyword} - {record.st_product}',
                    FlexibleTimeWindow = { "Mode": "OFF" },
                    Name = indexes['keyword'],
                    ScheduleExpression = "cron(10 20-23 * * ? *)",
                    ScheduleExpressionTimezone = "America/Sao_Paulo",
                    State = "ENABLED",
                    Target = {
                        "Arn": "arn:aws:sqs:sa-east-1:300303587993:near-crawler-ml",
                        "Input": json.dumps(
                            {
                                "keyword": record.st_keyword,
                                "idBrand": str(record.id_brand),
                                # TODO: Ricardo - Campo st_product da entidade Keyword deve serguir o modelo abaixo
                                #"brandProducts": json.loads(record.st_product)
                                # TODO: Ricardo - Campo variedade da entidade ClientBrandProduct + Id do produto
                                "brandProducts": [
                                    {
                                        "id_product": "d67caf98-f6a6-456c-b3b2-0237d177a386",
                                        "st_varity_seq": "1",
                                        "st_varity_name": "100ML",
                                        "db_price": 199.2
                                    },
                                    {
                                        "id_product": "d67caf98-f6a6-456c-b3b2-0237d177a386",
                                        "st_varity_seq": "2",
                                        "st_varity_name": "300ML",
                                        "db_price": 299.2
                                    }
                                ]
                            }
                        ),
                        "RetryPolicy": {
                            "MaximumEventAgeInSeconds": 86400,
                            "MaximumRetryAttempts": 0
                        },
                        "RoleArn": "arn:aws:iam::300303587993:role/service-role/EventBridgeSendMessageFull"
                    }
                )
        else:
            # Atualiza Schedule
            response = client.update_schedule(
                    ActionAfterCompletion = "NONE",
                    Description = f'{record.st_keyword} - {record.st_product}',
                    FlexibleTimeWindow = { "Mode": "OFF" },
                    Name = indexes['keyword'],
                    ScheduleExpression = "cron(10 20-23 * * ? *)",
                    ScheduleExpressionTimezone = "America/Sao_Paulo",
                    State = "ENABLED",
                    Target = {
                        "Arn": "arn:aws:sqs:sa-east-1:300303587993:near-crawler-ml",
                        "Input": json.dumps(
                            {
                                "keyword": record.st_keyword,
                                "idBrand": str(record.id_brand),
                                #"brandProducts": json.loads(record.st_product)
                                "brandProducts": [
                                    {
                                        "id_product": "d67caf98-f6a6-456c-b3b2-0237d177a386",
                                        "st_varity_seq": "1",
                                        "st_varity_name": "100ML"
                                    },
                                    {
                                        "id_product": "d67caf98-f6a6-456c-b3b2-0237d177a386",
                                        "st_varity_seq": "2",
                                        "st_varity_name": "300ML"
                                    }
                                ]
                            }
                        ),
                        "RetryPolicy": {
                            "MaximumEventAgeInSeconds": 86400,
                            "MaximumRetryAttempts": 0
                        },
                        "RoleArn": "arn:aws:iam::300303587993:role/service-role/EventBridgeSendMessageFull"
                    }
                )

        return 200, response
    
    def delete_schedule(self, indexes, filters, body) -> tuple[int, dict]:
        # Inicializa o cliente do EventBridge Schedule
        client = boto3.client('scheduler', region_name='sa-east-1')
        # Exclui o schedule
        client.delete_schedule(Name=indexes['keyword'])
        # Retorna o status 200
        return 200, None

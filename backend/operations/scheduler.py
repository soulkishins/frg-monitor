from operations.crud_base import Crud
from db.models import Scheduler, SchedulerStatistics
import boto3
import json
import os

crawler_sqs = os.getenv('crawler_sqs')
scheduler_region = os.getenv('scheduler_region')
scheduler_role_arn = os.getenv('scheduler_role_arn')

# Inicializa o cliente do EventBridge Schedule
client = boto3.client('scheduler', region_name=scheduler_region)

class SchedulerCrud(Crud):
    def get_model(self) -> Scheduler:
        return Scheduler
    
    def create(self, indexes, data) -> Scheduler:
        created = super().create(indexes, data)
        if created:
            self._session.flush()
            self.create_schedule(created)
        return created
    
    def update(self, indexes, data) -> Scheduler:
        original = super().read(indexes)
        original_cron = original.st_cron
        original_schedule_name = f'{original.st_platform}_{original.st_cron}'
        updated = super().update(indexes, data)
        updated_schedule_name = f'{updated.st_platform}_{updated.st_cron}'
        if updated:
            self._session.flush()
            self.create_schedule(updated)
            if original_schedule_name != updated_schedule_name and self._session.query(Scheduler).filter(Scheduler.st_cron == original_cron, Scheduler.id != updated.id).count() == 0:
                self.delete_schedule(original_schedule_name)
        return updated

    def read(self, indexes) -> Scheduler:
        record = super().read(indexes)
        if record.dt_last_execution:
            record.statistics = self._session.query(SchedulerStatistics).filter(SchedulerStatistics.id_scheduler == record.id, SchedulerStatistics.dt_created >= record.dt_last_execution).all()
        else:
            record.statistics = []
        return record

    def json_transform(self, method: str) -> dict:
        if method == 'read':
            return '_json_fields_scheduler';
        return None

    def filter_by_pk(self, indexes) -> list:
        return (Scheduler.id == indexes['scheduler'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'search_global' in filters:
            where.append(
                (Scheduler.st_platform.ilike(f"%{filters['search_global']}%")) |
                (Scheduler.st_cron.ilike(f"%{filters['search_global']}%"))
            )
        if 'st_platform' in filters:
            where.append(Scheduler.st_platform.ilike(f"%{filters['st_platform']}%"))
        if 'st_cron' in filters:
            where.append(Scheduler.st_cron.ilike(f"%{filters['st_cron']}%"))
        if 'dt_last_execution' in filters:
            dt_last_execution = self.get_range_datetime(filters['dt_last_execution'])
            where.append(Scheduler.dt_last_execution >= dt_last_execution[0])
            where.append(Scheduler.dt_last_execution <= dt_last_execution[1])

        return where + super().filter_by(indexes, filters)
    
    def get_schedule(self, indexes, filters, body) -> tuple[int, dict]:
        # Busca Schedule
        response = client.get_schedule(Name=indexes['scheduler'])

        return 200, response
    
    def create_schedule(self, record: Scheduler):           
        schedule_name = f'{record.st_platform}_{record.st_cron}'
        cron_parts = record.st_cron.split('_')
        scheduler_cron = f'cron({cron_parts[0]} {cron_parts[1]} ? * {cron_parts[2] if cron_parts[2] != "0" else "*"} *)'
        
        print(f'Criando schedule {schedule_name} com cron {scheduler_cron}')
        
        # Busca Schedule
        try:
            response = client.get_schedule(Name=schedule_name)
        except Exception as e:
            response = None
        
        if not response:
            # Cria Schedule
            response = client.create_schedule(
                    ActionAfterCompletion = "NONE",
                    Description = schedule_name,
                    FlexibleTimeWindow = { "Mode": "OFF" },
                    Name = schedule_name,
                    ScheduleExpression = scheduler_cron,
                    ScheduleExpressionTimezone = "America/Sao_Paulo",
                    State = "ENABLED",
                    Target = {
                        "Arn": crawler_sqs,
                        "Input": json.dumps(
                            {
                                "platform": record.st_platform,
                                "cron": record.st_cron
                            }
                        ),
                        "RetryPolicy": {
                            "MaximumEventAgeInSeconds": 86400,
                            "MaximumRetryAttempts": 0
                        },
                        "RoleArn": scheduler_role_arn
                    }
                )
    
    def delete_schedule(self, schedule_name: str):
        # Exclui o schedule
        try:
            client.delete_schedule(Name=schedule_name)
        except Exception as e:
            print(f"Schedule não encontrado: {e}")
    
    def setup_schedules(self, indexes: dict, filters: dict, body: dict) -> tuple[int, dict]:
        # Busca todos os registros da tabela Scheduler
        schedulers = self._session.query(Scheduler).all()
        for scheduler in schedulers:
            self.create_schedule(scheduler)
        return 200, None

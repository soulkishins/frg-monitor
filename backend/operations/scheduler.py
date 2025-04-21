from operations.crud_base import Crud, Page
from db.models import Scheduler, SchedulerStatistics
import boto3
import json
import os
from sqlalchemy import text

crawler_sqs = os.getenv('crawler_sqs')
scheduler_region = os.getenv('scheduler_region')
scheduler_role_arn = os.getenv('scheduler_role_arn')

# Inicializa o cliente do EventBridge Schedule
client = boto3.client('scheduler', region_name=scheduler_region)

class SchedulerResult:
    def __init__(self, id_keyword=None, st_keyword=None, st_status=None, id=None, st_platform=None, st_cron=None):
        self.id_keyword = id_keyword
        self.st_keyword = st_keyword
        self.st_status = st_status
        self.id = id
        self.st_platform = st_platform
        self.st_cron = st_cron
    
    def to_dict(self):
        if self.id is not None:
            # Retorna apenas os campos quando o filtro é id_keyword
            return {
                'id': self.id,
                'id_keyword': self.id_keyword,
                'st_platform': self.st_platform,
                'st_cron': self.st_cron
            }
        else:
            # Retorna os campos padrão quando não há filtro id_keyword
            return {
                'id_keyword': self.id_keyword,
                'st_keyword': self.st_keyword,
                'st_status': self.st_status
            }

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
        original_schedule_name = self.replace_schedule_name(original.st_platform, original.st_cron)
        updated = super().update(indexes, data)
        updated_schedule_name = self.replace_schedule_name(updated.st_platform, updated.st_cron)
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
        schedule_name = self.replace_schedule_name(record.st_platform, record.st_cron)
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

    def list(self, indexes, filters) -> tuple[int, list]:
        total = 0
        # Executa a consulta SQL baseada no filtro
        if 'id_keyword' in filters:
            result = self._session.execute(text(self.get_scheduler_by_id_keyword({'id_keyword': filters['id_keyword']})))
            rows = result.fetchall()
            # Converte os resultados em objetos SchedulerResult com as colunas específicas
            data = [SchedulerResult(id=row[0], id_keyword=row[1], st_platform=row[2], st_cron=row[3]) for row in rows]
            total = len(data)
        else:
            stmtc = self.get_scheduler_count()
            stmt = self.get_scheduler_enabled()
            if 'search_global' in filters:
                stmt += f" WHERE st_keyword ILIKE '%{filters['search_global']}%'"
            if 'page.sort' in filters:
                sort_field, sort_order = filters['page.sort'].split('.')
                stmt += f" ORDER BY {sort_field} {sort_order}"
            if 'page.limit' in filters:
                stmt += f" LIMIT {filters['page.limit']}"
            else:
                stmt += f" LIMIT {self._default_page_size}"
            if 'page.offset' in filters:
                stmt += f" OFFSET {filters['page.offset']}"
            print(stmt)
            result = self._session.execute(text(stmt))
            result_count = self._session.execute(text(stmtc))
            rows = result.fetchall()
            rows_count = result_count.fetchall()
            # Converte os resultados em objetos SchedulerResult com as colunas padrão
            data = [SchedulerResult(id_keyword=row[0], st_keyword=row[1], st_status=row[2]) for row in rows]
            total = rows_count[0][0]

        # Aplica paginação
        limit = int(filters.get('page.limit', self._default_page_size))
        offset = int(filters.get('page.offset', 0))

        return Page(
            data,
            total,
            limit,
            offset,
            filters.get('page.sort', 'dt_created.desc')
        )
        
    def get_scheduler_enabled(self) -> str:
        return f"""
            with schedules as
            (
            select ke.id_keyword, ke.st_keyword, case count(distinct sc.id) when 0 then 'disable' else 'enable' end st_status
            from {os.getenv("db_schema")}.tb_keyword ke
            left join {os.getenv("db_schema")}.tb_scheduler sc on
                ke.id_keyword = sc.id_keyword
            where 
                ke.st_status = 'active'
            group by
            ke.id_keyword, ke.st_keyword
            )
            select * from schedules
        """
    
    def get_scheduler_count(self) -> str:
        return f"""
            with schedules as
            (
            select ke.id_keyword, ke.st_keyword, case count(distinct sc.id) when 0 then 'disable' else 'enable' end st_status
            from {os.getenv("db_schema")}.tb_keyword ke
            left join {os.getenv("db_schema")}.tb_scheduler sc on
                ke.id_keyword = sc.id_keyword
            where 
                ke.st_status = 'active'
            group by
            ke.id_keyword, ke.st_keyword
            )
            select count(*) from schedules
        """

    def get_scheduler_by_id_keyword(self, indexes: dict) -> str:
        return f"""
            select id, id_keyword, st_platform, st_cron 
            from {os.getenv("db_schema")}.tb_scheduler 
            where id_keyword = '{indexes['id_keyword']}'
        """

    @staticmethod
    def replace_schedule_name(schedule_name: str, cron: str) -> str:
        return f'{schedule_name}_{cron.replace(",", "_")}'
    
    def delete(self, indexes) -> tuple[int, dict]:
        scheduler = self._session.query(Scheduler).filter(Scheduler.id == indexes['scheduler']).one()
        self._session.query(SchedulerStatistics).filter(SchedulerStatistics.id_scheduler == scheduler.id).delete()
        original_schedule_name = SchedulerCrud.replace_schedule_name(scheduler.st_platform, scheduler.st_cron)
        if self._session.query(Scheduler).filter(Scheduler.st_cron == scheduler.st_cron, Scheduler.id != scheduler.id).count() == 0:
            self.delete_schedule(original_schedule_name)
        self._session.delete(scheduler)
        self._session.flush()
        return scheduler
from operations.crud_base import Crud
from db.models import Keyword, ClientBrand, Client, Scheduler, SchedulerStatistics
from sqlalchemy.orm import contains_eager
import boto3
import os

scheduler_region = os.getenv('scheduler_region')

# Inicializa o cliente do EventBridge Schedule
client = boto3.client('scheduler', region_name=scheduler_region)
class KeywordCrud(Crud):
    def get_model(self) -> Keyword:
        return Keyword
        
    def delete(self, indexes) -> tuple[int, dict]:
        self._session.query(SchedulerStatistics).filter(SchedulerStatistics.id_scheduler.in_(self._session.query(Scheduler.id).filter(Scheduler.id_keyword == indexes['keyword']))).delete()
        schedulers = self._session.query(Scheduler).filter(Scheduler.id_keyword == indexes['keyword']).all()
        for scheduler in schedulers:
            original_schedule_name = f'{scheduler.st_platform} - {scheduler.st_cron}'
            if self._session.query(Scheduler).filter(Scheduler.st_cron == scheduler.st_cron, Scheduler.id != scheduler.id).count() == 0:
                self.delete_schedule(original_schedule_name)
            self._session.delete(scheduler)
        self._session.flush()
        deleted = super().delete(indexes)
        return deleted
    
    def get_joins(self, indexes, filters) -> list:
        return (Keyword.brand,ClientBrand.client)
    
    def get_options(self) -> list:
        return (contains_eager(Keyword.brand).contains_eager(ClientBrand.client),)

    def filter_by_pk(self, indexes) -> list:
        return (Keyword.id_keyword == indexes['keyword'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'search_global' in filters:
            where.append(
                (Keyword.st_keyword.ilike(f"%{filters['search_global']}%")) |
                (ClientBrand.st_brand.ilike(f"%{filters['search_global']}%")) |
                (Client.st_name.ilike(f"%{filters['search_global']}%")) 
            )
        if 'brand' in indexes:
            where.append(Keyword.id_brand == indexes['brand'])
        if 'st_keyword' in filters:
            where.append(Keyword.st_keyword.ilike(f"%{filters['st_keyword']}%"))
        if 'st_product' in filters:
            where.append(Keyword.st_product.ilike(f"%{filters['st_product']}%"))
        if 'st_status' in filters:
            where.append(Keyword.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)    

    def get_orderby(self, orderby: str):
        if not orderby:
            return Keyword.dt_created.desc()
        order = orderby.split('.')
        if len(order) == 3 and order[0] == 'brand' and order[1] == 'st_brand':
            return ClientBrand.st_brand.asc() if order[2] == 'asc' else ClientBrand.st_brand.desc()
        if len(order) == 4 and order[0] == 'brand' and order[1] == 'client':
            return Client.st_name.asc() if order[3] == 'asc' else Client.st_name.desc()            
        if len(order) == 1:
            return getattr(Keyword, order[0]).asc()
        if order[1] == 'desc':
            return getattr(Keyword, order[0]).desc()
        return getattr(Keyword, order[0]).asc()
    
    def delete_schedule(self, schedule_name: str):
        # Exclui o schedule
        try:
            client.delete_schedule(Name=schedule_name)
        except Exception as e:
            print(f"Schedule não encontrado: {e}")
from operations.crud_base import Crud
from sqlalchemy import text
import os
class Dashboard(Crud):
    def list(self, indexes, filters) -> tuple[int, list]:
        
        dash_type = filters.get('dash_type', 'status')
        
        if dash_type == 'status':
            results = self._session.execute(text(self.get_status())).fetchall()
        elif dash_type == 'top_keywords':
            results = self._session.execute(text(self.get_top_keywords())).fetchall()
        elif dash_type == 'ads_report':
            results = self._session.execute(text(self.get_ads_report())).fetchall()

        return [self.tuple_to_dict(result, dash_type) for result in results]
    
    def tuple_to_dict(self, result, data_type) -> list:
        if data_type == 'status':
            return {
                'clients': result[0],
                'leads': result[1],
                'brands': result[2],
                'products': result[3],
                'keywords': result[4],
                'brandkeywords': result[5],
                'ads': result[6],
                'newads': result[7],
            }
        elif data_type == 'top_keywords':
            return {
                'keyword': result[0],
                'ads': result[1],
                'reports': result[2],
            }
        elif data_type == 'ads_report':
            return {
                'date': result[0],
                'news': result[1],
                'upds': result[2],
                'rpts': result[3],
            }

    def get_status(self) -> str:
        return f"""
            with dates (cdate, ctime, days) as (
                select
                    current_date,
                    current_timestamp,
                    to_char(current_date, 'dd')::int
            )
            select
                (select count(1) from {os.getenv("db_schema")}.tb_client where st_status <> 'INACTIVE') as clients,
                (select count(1) from {os.getenv("db_schema")}.tb_client where st_status = 'LEAD') as leads,
                (select count(1) from {os.getenv("db_schema")}.tb_client_brand where st_status <> 'INACTIVE') as brands,
                (select count(1) from {os.getenv("db_schema")}.tb_client_brand_product where st_status <> 'INACTIVE') as products,
                (select count(1) from {os.getenv("db_schema")}.tb_keyword where st_status <> 'INACTIVE') as keywords,
                (select count(distinct id_brand) from {os.getenv("db_schema")}.tb_keyword where st_status <> 'INACTIVE') as brandkeywords,
                (select count(1) from {os.getenv("db_schema")}.tb_advertisement where coalesce(dt_modified, dt_created) >= cdate - INTERVAL '1 days' * days) as ads,
                (select count(1) from {os.getenv("db_schema")}.tb_advertisement where coalesce(dt_modified, dt_created) >= ctime - INTERVAL '1 days') as newads
            from dates
        """
    
    def get_top_keywords(self) -> str:
        return f"""
            select 
                k.st_keyword keyword,
                count(distinct ah.id_advertisement) ads,
                count(distinct CASE WHEN ah.st_status = 'REPORTED' THEN ah.id_advertisement END) reports
            from
                {os.getenv("db_schema")}.tb_keyword k
                left join {os.getenv("db_schema")}.tb_advertisement_keyword ak on
                    k.id_keyword = ak.id_keyword
                left join {os.getenv("db_schema")}.tb_advertisement_history ah on
                    ak.id_advertisement = ah.id_advertisement
                and ah.dt_created >= current_timestamp - INTERVAL '1 days'
            where
                k.st_status <> 'INACTIVE'
            group by
                k.st_keyword
            order by
                ads desc
            limit 20
        """

    def get_ads_report(self) -> str:
        return f"""
            WITH last_7_days AS (
                SELECT CURRENT_DATE - (INTERVAL '1 days' * i) AS dt
                FROM generate_series(0, 6) AS i
            )
            select
            l7.dt,
            count(CASE WHEN ah.st_action = 'CRAWLER_CREATED' THEN ah.id_advertisement END) news,
            count(CASE WHEN ah.st_action = 'CRAWLER_UPDATED' THEN ah.id_advertisement END) upds,
            count(CASE WHEN ah.st_action = 'USER_REPORTED' THEN ah.id_advertisement END) rpts
            from 
            last_7_days l7
            left join {os.getenv("db_schema")}.tb_advertisement_history ah on
                ah.dt_created::date = l7.dt 
            group by
                l7.dt
        """

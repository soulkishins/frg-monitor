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
        elif dash_type == 'scheduler_counts':
            results = self._session.execute(text(self.get_scheduler_counts())).fetchall()
        elif dash_type == 'schedulers_statistics':
            results = self._session.execute(text(self.get_schedulers_statistics())).fetchall()

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
        elif data_type == 'scheduler_counts':
            return {
                'count_scheduler': result[0],
                'count_keywords': result[1],
                'avg_keywords': result[2],
                'exec_keywords': result[3],
            }
        elif data_type == 'schedulers_statistics':
            return {
                'nr_pages': result[0],
                'nr_total': result[1],
                'nr_error': result[2],
                'nr_reported': result[3],
                'nr_manual_revision': result[4],
                'nr_already_reported': result[5],
                'nr_invalidate': result[6],
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

    def get_scheduler_counts(self) -> str:
        return f"""
            with keywords_per_cron as (
                select
                    sc.st_cron,
                    count(distinct sc.id_keyword) as count_keywords
                from
                    {os.getenv("db_schema")}.tb_scheduler sc
                    join {os.getenv("db_schema")}.tb_keyword ke on sc.id_keyword = ke.id_keyword
                where 
                    ke.st_status = 'active'
                group by
                    sc.st_cron
            )
            select
                count(distinct sc.st_cron) as count_scheduler,
                count(distinct sc.id_keyword) as count_keywords,
                avg(kpc.count_keywords) as avg_keywords,
                count(ss.id_scheduler) as exec_keywords
            from
                {os.getenv("db_schema")}.tb_scheduler sc
                join {os.getenv("db_schema")}.tb_keyword ke on sc.id_keyword = ke.id_keyword
                left join {os.getenv("db_schema")}.tb_scheduler_statistics ss on
                    sc.id = ss.id_scheduler
                    and ss.dt_created >= current_date
                left join keywords_per_cron kpc on
                    sc.st_cron = kpc.st_cron
            where 
                ke.st_status = 'active';
        """
    
    def get_schedulers_statistics(self) -> str:
        return f"""
            select
                sum(ss.nr_pages) nr_pages,
                sum(ss.nr_total) nr_total,
                sum(ss.nr_error) nr_error,
                sum(ss.nr_reported) nr_reported,
                sum(ss.nr_manual_revision) nr_manual_revision,
                sum(ss.nr_already_reported) nr_already_reported,
                sum(ss.nr_invalidate) nr_invalidate
            from
                {os.getenv("db_schema")}.tb_scheduler sc
                join {os.getenv("db_schema")}.tb_keyword ke on
                    sc.id_keyword = ke.id_keyword
                join {os.getenv("db_schema")}.tb_scheduler_statistics ss on
                    sc.id = ss.id_scheduler
                and ss.dt_created >= current_date
            where 
                ke.st_status = 'active'
        """

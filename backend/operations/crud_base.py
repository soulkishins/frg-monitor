from db.models import Audit
from datetime import datetime, timedelta

class Crud:
    def __init__(self, user, session):
        self._user = user
        self._session = session
        self._default_page_size = 100

    def create(self, indexes, data) -> Audit:
        model = self.to_model(indexes, data)
        if isinstance(model, (list, tuple)):
            self._session.add_all(model)
        else:
            self._session.add(model)
        return model

    def read(self, indexes) -> Audit:
        query = self._session.query(self.get_model())
        options = self.get_options()
        if options:
            for option in options:
                query = query.options(option)
        joins = self.get_joins(indexes, {})
        if joins:
            for join in joins:
                if isinstance(join, (list, tuple)):
                    query = query.outerjoin(*join)
                else:
                    query = query.outerjoin(join)
        records = query.filter(*self.filter_by_pk(indexes)).all()
        if len(records) > 0:
            return records[0]
        return None
    
    def update(self, index, data) -> Audit:
        model = self.read(index)
        if model:
            self.set_attr(model, data)
            return model
        return None

    def delete(self, index) -> Audit:
        model = self.read(index)
        if model:
            self._session.delete(model)
        return model

    def list(self, indexes, filters) -> list:
        query = self._session.query(self.get_model())
        options = self.get_options()
        if options:
            for option in options:
                query = query.options(option)
        joins = self.get_joins(indexes, filters)
        if joins:
            for join in joins:
                if isinstance(join, (list, tuple)):
                    query = query.outerjoin(*join)
                else:
                    query = query.outerjoin(join)
        if self.has_filters(indexes, filters):
            query = query.filter(*self.filter_by(indexes, filters))
        
        total = query.count()
        if 'page.sort' in filters:
            query = query.order_by(self.get_orderby(filters['page.sort']))

        query = query.limit(filters['page.limit'] if 'page.limit' in filters else self._default_page_size)
        if 'page.offset' in filters:
            query = query.offset(filters['page.offset'])
        
        return Page(
            query.all(),
            total,
            filters['page.limit'] if 'page.limit' in filters else self._default_page_size,
            filters['page.offset'] if 'page.offset' in filters else 0,
            filters['page.sort'] if 'page.sort' in filters else 'dt_created.desc'
        )
    
    def set_attr(self, model, data, ignore = []):
        for key, value in data.items():
            if ignore.count(key) == 0:
                setattr(model, key, value)

    def to_model(self, indexes, data) -> Audit:
        return self.get_model()(**data)

    def get_model(self) -> Audit:
        raise NotImplementedError("Method not implemented")
    
    def get_options(self) -> list:
        return None

    def filter_by_pk(self, indexes) -> list:
        raise NotImplementedError("Method not implemented")

    def has_filters(self, indexes, filters) -> bool:
        return len(indexes) > 0 or 'all' not in filters or len(filters.items()) > 1

    def filter_by(self, indexes, filters) -> list:
        where = []
        if 'st_created_by' in filters:
            where.append(self.get_model().st_created_by.ilike(f"%{filters['st_created_by']}%"))
        if 'st_modified_by' in filters:
            where.append(self.get_model().st_modified_by.ilike(f"%{filters['st_modified_by']}%"))
        if 'dt_created' in filters:
            dt_created = self.get_range_datetime(filters['dt_created'])
            where.append(self.get_model().dt_created >= dt_created[0])
            where.append(self.get_model().dt_created <= dt_created[1])
        if 'dt_modified' in filters:
            dt_modified = self.get_range_datetime(filters['dt_modified'])
            where.append(self.get_model().dt_modified >= dt_modified[0])
            where.append(self.get_model().dt_modified <= dt_modified[1])
        return where

    def get_joins(self, indexes, filters) -> list:
        return None
    
    def get_range_datetime(self, range: str) -> tuple[datetime, datetime]:
        range = range.split(',')
        start = range[0] if len(range[0]) > 10 else range[0] + 'T00:00:00'
        end = range[-1] if len(range[-1]) > 10 else range[-1] + 'T00:00:00'

        format = "%Y-%m-%dT%H:%M:%S"
        
        start_date = datetime.strptime(start, format)
        end_date = datetime.strptime(end, format)
        
        if len(range[-1]) == 10:
            end_date = end_date + timedelta(days=1)

        return (start_date, end_date)
    
    def json_transform(self, method):
        return None
    
    def get_orderby(self, orderby: str):
        if not orderby:
            return self.get_model().dt_created.desc()
        order = orderby.split('.')
        if len(order) == 1:
            return getattr(self.get_model(), order[0]).asc()
        if order[1] == 'desc':
            return getattr(self.get_model(), order[0]).desc()
        return getattr(self.get_model(), order[0]).asc()

class Page:
    def __init__(self, list: list, total: int, limit: int = 100, offset: int = 0, sort: str = 'dt_created.desc'):
        self.list = list
        self.page = {
            'total': total,
            'limit': limit,
            'offset': offset,
            'sort': sort
        }
        
    def to_dict(self):
        return {
            'list': self.list,
            'page': self.page
        }


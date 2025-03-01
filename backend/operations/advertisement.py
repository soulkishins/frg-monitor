from operations.crud_base import Crud
from db.models import Advertisement, ClientBrand
from sqlalchemy.orm import contains_eager

class AdvertisementCrud(Crud):
    def get_model(self) -> Advertisement:
        return Advertisement
    
    def get_joins(self, indexes, filters) -> list:
        return (Advertisement.products)
    
    def get_options(self) -> list:
        return (contains_eager(Advertisement.products))

    def filter_by_pk(self, indexes) -> list:
        return (Advertisement.id_advertisement == indexes['advertisement'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'brand' in indexes:
            where.append(Advertisement.id_brand == indexes['brand'])
        if 'st_plataform' in filters:
            where.append(Advertisement.st_plataform.ilike(f"%{filters['st_plataform']}%"))
        if 'st_url' in filters:
            where.append(Advertisement.st_url.ilike(f"%{filters['st_url']}%"))
        if 'st_title' in filters:
            where.append(Advertisement.st_title.ilike(f"%{filters['st_title']}%"))
        if 'st_description' in filters:
            where.append(Advertisement.st_description.ilike(f"%{filters['st_description']}%"))
        if 'st_vendor' in filters:
            where.append(Advertisement.st_vendor.ilike(f"%{filters['st_vendor']}%"))
        if 'db_price' in filters:
            where.append(Advertisement.db_price == filters['db_price'])
        if 'st_status' in filters:
            where.append(Advertisement.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)
    
    def list(self, indexes, filters) -> list:
        query = self._session.query(Advertisement)
        if self.has_filters(indexes, filters):
            query = query.filter(*self.filter_by(indexes, filters))

        total = query.count()

        query = query.limit(filters['page.limit'] if 'page.limit' in filters else self._default_page_size)
        if 'page.offset' in filters:
            query = query.offset(filters['page.offset'])
        if 'page.sort' in filters:
            query = query.order_by(self.get_orderby(filters['page.sort']))

        list = {
            'list': query.all(),
            'page': {
                'limit': filters['page.limit'] if 'page.limit' in filters else self._default_page_size,
                'offset': filters['page.offset'] if 'page.offset' in filters else 0,
                'sort': filters['page.sort'] if 'page.sort' in filters else 'dt_created.desc',
                'total': total
            }
        }
        return list
    
    def json_transform(self, method):
        if method == 'read_full':
            return 'to_full_dict'
        return None
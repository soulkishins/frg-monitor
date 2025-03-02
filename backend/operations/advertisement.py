from operations.crud_base import Crud, Page
from db.models import Advertisement, ClientBrand, AdvertisementProduct
from db.views import VW_Advertisement
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

        if 'client' in indexes:
            where.append(VW_Advertisement.id_client == indexes['client'])
        if 'brand' in indexes:
            where.append(VW_Advertisement.id_brand == indexes['brand'])
        if 'product' in indexes:
            where.append(VW_Advertisement.id_product.like(f"%{indexes['product']}%"))
        if 'st_plataform' in filters:
            where.append(VW_Advertisement.st_plataform.ilike(f"%{filters['st_plataform']}%"))
        if 'st_plataform_id' in filters:
            where.append(VW_Advertisement.st_plataform_id.ilike(f"%{filters['st_plataform_id']}%"))
        if 'st_url' in filters:
            where.append(VW_Advertisement.st_url.ilike(f"%{filters['st_url']}%"))
        if 'st_name' in filters:
            where.append(VW_Advertisement.st_name.ilike(f"%{filters['st_name']}%"))
        if 'st_brand' in filters:
            where.append(VW_Advertisement.st_brand.ilike(f"%{filters['st_brand']}%"))
        if 'st_product' in filters:
            where.append(VW_Advertisement.st_product.ilike(f"%{filters['st_product']}%"))
        if 'st_title' in filters:
            where.append(VW_Advertisement.st_title.ilike(f"%{filters['st_title']}%"))
        if 'st_price_min' in filters:
            where.append(VW_Advertisement.db_price >= filters['st_price_min'])
        if 'st_price_max' in filters:
            where.append(VW_Advertisement.db_price <= filters['st_price_max'])
        if 'st_status' in filters:
            where.append(VW_Advertisement.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)
    
    def list(self, indexes, filters) -> list:
        query = self._session.query(VW_Advertisement)

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
    
    def json_transform(self, method):
        if method == 'read_full':
            return '_full_json_fields'
        return None
    
    def get_orderby(self, orderby: str):
        if not orderby:
            return VW_Advertisement.st_name.asc()
        order = orderby.split('.')
        if len(order) == 1:
            return getattr(VW_Advertisement, order[0]).asc()
        if order[1] == 'desc':
            return getattr(VW_Advertisement, order[0]).desc()
        return getattr(VW_Advertisement, order[0]).asc()


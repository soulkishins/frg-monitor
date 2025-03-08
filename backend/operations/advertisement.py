from operations.crud_base import Crud, Page
from db.models import Advertisement, ClientBrand, ClientBrandProduct, AdvertisementProduct, Subcategory, AdvertisementHistory, AdvertisementExport
from db.views import VW_Advertisement
from sqlalchemy.orm import contains_eager

class AdvertisementCrud(Crud):
    def get_model(self) -> Advertisement:
        return Advertisement
    
    def get_joins(self, indexes, filters) -> list:
        return (
            Advertisement.products,
            AdvertisementProduct.product,
            ClientBrandProduct.subcategory,
            Subcategory.category,
            Advertisement.brand,
            ClientBrand.client
        )
    
    def get_options(self) -> list:
        return (
            contains_eager(Advertisement.products)
            .contains_eager(AdvertisementProduct.product)
            .contains_eager(ClientBrandProduct.subcategory)
            .contains_eager(Subcategory.category),
            contains_eager(Advertisement.brand).contains_eager(ClientBrand.client)
        )

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
        if 'st_seller' in filters:
            where.append(VW_Advertisement.st_seller.ilike(f"%{filters['st_seller']}%"))
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
    
    def history(self, indexes, filters, body) -> tuple:
        query = self._session.query(AdvertisementHistory)
        if 'advertisement' in indexes:
            query = query.filter(AdvertisementHistory.id_advertisement == indexes['advertisement'])
        query = query.order_by(AdvertisementHistory.dt_created.desc())
        return (200, query.limit(20).all())
    
    def upd_status(self, indexes, filters, body) -> tuple:
        from sqlalchemy import update, insert, func
        stmt = (
            update(Advertisement)
            .where(Advertisement.id_advertisement.in_(body['ids']))
            .values(
                st_status = body['status'],
                dt_modified = func.current_timestamp(),
                st_modified_by = self._user
            )
        )
        # Executa a atualização
        result = self._session.execute(stmt)
        ads = (
            self._session
            .query(Advertisement)
            .filter(Advertisement.id_advertisement.in_(body['ids']))
            .all()
        )
            
        self._session.add_all(
            [AdvertisementHistory(
                id_advertisement = ad.id_advertisement,
                dt_history = func.current_timestamp(),
                st_status = body['status'],
                st_action = f'USER_{body["status"]}',
                st_history = str(ad)
            ) for ad in ads]
        )
        
        self._session.commit()
        return (200, f"Registros atualizados: {result.rowcount}")
    
    def export_status(self, indexes, filters, body) -> tuple:
        query = self._session.query(AdvertisementExport)
        query = query.filter(AdvertisementExport.st_key == filters['key'])
        export = query.first()
        if export:
            return (200, None, {"x-export-status": export.st_status, "Access-Control-Expose-Headers": "x-export-status,X-Export-Status"})
        else:
            return (200, None, {"x-export-status": "PENDING", "Access-Control-Expose-Headers": "x-export-status,X-Export-Status"})
    
    def json_transform(self, method):
        if method == 'read':
            return '_json_fields_advertisement'
        if method == 'history':
            return '_json_fields_advertisement'
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


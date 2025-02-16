from operations.crud_base import Crud
from db.models import ClientBrandProduct, ClientBrand
from sqlalchemy.orm import contains_eager

class ClientBrandProductCrud(Crud):
    def get_model(self) -> ClientBrandProduct:
        return ClientBrandProduct
    
    def get_joins(self, indexes, filters) -> list:
        return (ClientBrandProduct.brand, ClientBrandProduct.subcategory)
    
    def get_options(self) -> list:
        return (contains_eager(ClientBrandProduct.brand), contains_eager(ClientBrandProduct.subcategory))

    def filter_by_pk(self, indexes) -> list:
        return (ClientBrandProduct.id_product == indexes['client_brand_prod'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'st_brand' in indexes:
            where.append(ClientBrand.st_name == indexes['st_brand'])
        if 'subcategory' in indexes:
            where.append(ClientBrandProduct.id_subcategory == indexes['subcategory'])

        if 'st_product' in filters:
            where.append(ClientBrandProduct.st_product.ilike(f"%{filters['st_product']}%"))
        if 'st_variety' in filters:
            where.append(ClientBrandProduct.st_variety.ilike(f"%{filters['st_variety']}%"))
        if 'st_status' in filters:
            where.append(ClientBrandProduct.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)

    def to_model(self, indexes, data) -> ClientBrandProduct:
        data['id_brand'] = indexes['brand']
        return super().to_model(indexes, data)
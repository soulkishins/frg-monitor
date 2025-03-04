from operations.crud_base import Crud
from db.models import ClientBrandProduct, ClientBrand, Subcategory, Client
from sqlalchemy.orm import contains_eager

class ClientBrandProductCrud(Crud):
    def get_model(self) -> ClientBrandProduct:
        return ClientBrandProduct
    
    def get_joins(self, indexes, filters) -> list:
        return (
            ClientBrandProduct.brand,
            ClientBrand.client,
            ClientBrandProduct.subcategory,
            Subcategory.category
        )
    
    def get_options(self) -> list:
        return (
            contains_eager(ClientBrandProduct.brand).contains_eager(ClientBrand.client),
            contains_eager(ClientBrandProduct.subcategory).contains_eager(Subcategory.category)
        )

    def filter_by_pk(self, indexes) -> list:
        return (ClientBrandProduct.id_product == indexes['product'],)

    def filter_by(self, indexes, filters) -> list:
        where = []
        
        if 'id_brand' in indexes:
            where.append(ClientBrand.id_brand == filters['id_brand'])

        if 'st_brand' in indexes:
            where.append(ClientBrand.st_name == filters['st_brand'])
        if 'subcategory' in indexes:
            where.append(ClientBrandProduct.id_subcategory == filters['subcategory'])

        if 'st_product' in filters:
            where.append(ClientBrandProduct.st_product.ilike(f"%{filters['st_product']}%"))
        if 'st_variety' in filters:
            where.append(ClientBrandProduct.st_variety.ilike(f"%{filters['st_variety']}%"))
        if 'st_status' in filters:
            where.append(ClientBrandProduct.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)
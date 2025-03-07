from operations.crud_base import Crud
from db.models import ClientBrandProduct, ClientBrand, Subcategory, Client, Category
from sqlalchemy.orm import contains_eager

class ClientBrandProductCrud(Crud):
    def get_model(self) -> ClientBrandProduct:
        return ClientBrandProduct
    
    def get_joins(self, indexes, filters) -> list:
        return (
            ClientBrandProduct.brand,
            ClientBrand.client,
            ClientBrandProduct.subcategory,
            Subcategory.category,
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
        
        if 'st_name' in filters:
            where.append(Client.st_name.ilike(f"%{filters['st_name']}%"))
            
        if 'id_brand' in filters:
            where.append(ClientBrandProduct.id_brand == filters['id_brand'])
        if 'st_brand' in filters:
            where.append(ClientBrand.st_brand.ilike(f"%{filters['st_brand']}%"))
            
        if 'st_category' in filters:
            where.append(Category.st_category.ilike(f"%{filters['st_category']}%"))
        if 'st_subcategory' in filters:
            where.append(Subcategory.st_subcategory.ilike(f"%{filters['st_subcategory']}%"))
        if 'subcategory' in filters:
            where.append(ClientBrandProduct.id_subcategory == filters['subcategory'])

        if 'st_product' in filters:
            where.append(ClientBrandProduct.st_product.ilike(f"%{filters['st_product']}%"))
        if 'st_variety' in filters:
            where.append(ClientBrandProduct.st_variety.ilike(f"%{filters['st_variety']}%"))
        if 'st_status' in filters:
            where.append(ClientBrandProduct.st_status == filters['st_status'])

            
        return where + super().filter_by(indexes, filters)

    def get_orderby(self, orderby: str):
        if not orderby:
            return ClientBrandProduct.dt_created.desc()
        order = orderby.split('.')
        if order[0] == 'st_name':
            return Client.st_name.asc() if len(order) == 1 or order[1] == 'asc' else Client.st_name.desc()
        if order[0] == 'st_brand':
            return ClientBrand.st_brand.asc() if len(order) == 1 or order[1] == 'asc' else ClientBrand.st_brand.desc()        
        if order[0] == 'st_category':
            return Category.st_category.asc() if len(order) == 1 or order[1] == 'asc' else Category.st_category.desc()
        if order[0] == 'st_subcategory':
            return Subcategory.st_subcategory.asc() if len(order) == 1 or order[1] == 'asc' else Subcategory.st_subcategory.desc()
        if len(order) == 1:
            return getattr(ClientBrandProduct, order[0]).asc()
        if order[1] == 'desc':
            return getattr(ClientBrandProduct, order[0]).desc()
        return getattr(ClientBrandProduct, order[0]).asc()
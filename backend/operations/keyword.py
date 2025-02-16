from operations.crud_base import Crud
from db.models import Keyword, ClientBrand
from sqlalchemy.orm import contains_eager

class KeywordCrud(Crud):
    def get_model(self) -> Keyword:
        return Keyword
    
    def get_joins(self, indexes, filters) -> list:
        return (Keyword.brand,)
    
    def get_options(self) -> list:
        return (contains_eager(Keyword.brand),)

    def filter_by_pk(self, indexes) -> list:
        return (Keyword.id_keyword == indexes['keyword'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'brand' in indexes:
            where.append(Keyword.id_brand == indexes['brand'])
        if 'st_keyword' in filters:
            where.append(Keyword.st_keyword.ilike(f"%{filters['st_keyword']}%"))
        if 'st_product' in filters:
            where.append(Keyword.st_product.ilike(f"%{filters['st_product']}%"))
        if 'st_status' in filters:
            where.append(Keyword.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)

    def to_model(self, indexes, data) -> Keyword:
        data['id_brand'] = indexes['brand']
        return super().to_model(indexes, data)
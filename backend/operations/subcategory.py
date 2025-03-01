from operations.crud_base import Crud
from db.models import Subcategory, Category
from sqlalchemy.orm import contains_eager

class SubcategoryCrud(Crud):
    def get_model(self) -> Subcategory:
        return Subcategory
    
    def get_joins(self, indexes, filters) -> list:
        return (Subcategory.category,)
    
    def get_options(self) -> list:
        return (contains_eager(Subcategory.category),)

    def filter_by_pk(self, indexes) -> list:
        return (Subcategory.id_subcategory == indexes['subcategory'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'category' in indexes:
            where.append(Subcategory.id_category == indexes['category'])
        if 'st_subcategory' in filters:
            where.append(Subcategory.st_subcategory.ilike(f"%{filters['st_subcategory']}%"))
        if 'st_status' in filters:
            where.append(Subcategory.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)
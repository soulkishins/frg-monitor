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

        if 'st_category' in filters and 'st_subcategory' in filters:
            where.append(
                (Category.st_category.ilike(f"%{filters['st_category']}%")) |
                (Subcategory.st_subcategory.ilike(f"%{filters['st_subcategory']}%"))
            )
        else:
            if 'search_global' in filters:
                where.append(
                    (Category.st_category.ilike(f"%{filters['search_global']}%")) |
                    (Subcategory.st_subcategory.ilike(f"%{filters['search_global']}%"))
                )
            if 'category' in indexes:
                where.append(Subcategory.id_category == indexes['category'])
            if 'st_subcategory' in filters:
                where.append(Subcategory.st_subcategory.ilike(f"%{filters['st_subcategory']}%"))
        if 'st_status' in filters:
            where.append(Subcategory.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)

    def get_orderby(self, orderby: str):
        if not orderby:
            return Subcategory.dt_created.desc()
        order = orderby.split('.')
        if len(order) == 3 and order[0] == 'category' and order[1] == 'st_category':
            return Category.st_category.asc() if order[2] == 'asc' else Category.st_category.desc()
        if len(order) == 1:
            return getattr(Subcategory, order[0]).asc()
        if order[1] == 'desc':
            return getattr(Subcategory, order[0]).desc()
        return getattr(Subcategory, order[0]).asc()
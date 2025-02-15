from operations.crud_base import Crud
from db.models import Category

class CategoryCrud(Crud):
    def get_model(self) -> Category:
        return Category

    def filter_by_pk(self, indexes) -> list:
        return (Category.id == indexes['category'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'st_category' in filters:
            where.append(Category.st_category.ilike(f"%{filters['st_category']}%"))
        if 'st_status' in filters:
            where.append(Category.st_status.ilike(f"%{filters['st_status']}%"))

        return where + super().filter_by(indexes, filters)
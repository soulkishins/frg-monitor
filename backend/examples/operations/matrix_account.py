from operations.crud_base import Crud
from db.models import MatrixAccount

class MatrixAccountCrud(Crud):
    def get_model(self) -> MatrixAccount:
        return MatrixAccount

    def filter_by_pk(self, indexes) -> list:
        return (MatrixAccount.id == indexes['account'],)

    def filter_by(self, indexes, filters) -> list:
        where = []
        if 'id' in filters:
            where.append(MatrixAccount.id == filters['id'])
        if 'st_name' in filters:
            where.append(MatrixAccount.st_name.ilike(f"%{filters['st_name']}%"))
        if 'st_url' in filters:
            where.append(MatrixAccount.st_url.ilike(f"%{filters['st_url']}%"))
        where = where + super().filter_by(indexes, filters)
        return where
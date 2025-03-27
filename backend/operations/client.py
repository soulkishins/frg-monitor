from operations.crud_base import Crud
from db.models import Client

class ClientCrud(Crud):
    def get_model(self) -> Client:
        return Client

    def filter_by_pk(self, indexes) -> list:
        return (Client.id == indexes['client'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'search_global' in filters:
            where.append(
                (Client.st_name.ilike(f"%{filters['search_global']}%")) |
                (Client.st_document.ilike(f"%{filters['search_global']}%"))
            )
        if 'st_name' in filters:
            where.append(Client.st_name.ilike(f"%{filters['st_name']}%"))
        if 'st_document' in filters:
            where.append(Client.st_document.ilike(f"%{filters['st_document']}%"))
        if 'st_status' in filters:
            where.append(Client.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)
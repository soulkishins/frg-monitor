from operations.crud_base import Crud
from db.models import ClientBrand, Client
from sqlalchemy.orm import contains_eager

class ClientBrandCrud(Crud):
    def get_model(self) -> ClientBrand:
        return ClientBrand
    
    def get_joins(self, indexes, filters) -> list:
        return (ClientBrand.client,)
    
    def get_options(self) -> list:
        return (contains_eager(ClientBrand.client),)

    def filter_by_pk(self, indexes) -> list:
        return (ClientBrand.id_brand == indexes['brand'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'st_client_name' in filters:
            where.append(Client.st_name.ilike(f"%{filters['st_client_name']}%"))
        if 'st_brand' in filters:
            where.append(ClientBrand.st_brand.ilike(f"%{filters['st_brand']}%"))
        if 'st_status' in filters:
            where.append(ClientBrand.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)

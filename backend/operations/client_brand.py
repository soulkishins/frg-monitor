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

        if 'st_client_name' in filters and 'st_brand' in filters:
            where.append(
                (Client.st_name.ilike(f"%{filters['st_client_name']}%")) |
                (ClientBrand.st_brand.ilike(f"%{filters['st_brand']}%"))
            )
        else:
            if 'search_global' in filters:
                where.append(
                    (Client.st_name.ilike(f"%{filters['search_global']}%")) |
                    (ClientBrand.st_brand.ilike(f"%{filters['search_global']}%"))
                )
            if 'st_client_name' in filters:
                where.append(Client.st_name.ilike(f"%{filters['st_client_name']}%"))
            if 'st_brand' in filters:
                where.append(ClientBrand.st_brand.ilike(f"%{filters['st_brand']}%"))
        if 'st_status' in filters:
            where.append(ClientBrand.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)

    def get_orderby(self, orderby: str):
        if not orderby:
            return ClientBrand.dt_created.desc()
        order = orderby.split('.')
        if order[0] == 'st_client':
            return Client.st_name.asc() if len(order) == 1 or order[1] == 'asc' else Client.st_name.desc()
        if len(order) == 1:
            return getattr(ClientBrand, order[0]).asc()
        if order[1] == 'desc':
            return getattr(ClientBrand, order[0]).desc()
        return getattr(ClientBrand, order[0]).asc()

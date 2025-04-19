from operations.crud_base import Crud
from db.models import AdvertisementProduct

class AdvertisementProductCrud(Crud):
    def get_model(self) -> AdvertisementProduct:
        return AdvertisementProduct

    def filter_by_pk(self, indexes) -> list:
        return (AdvertisementProduct.id_advertisement == indexes['advertisement'],
                AdvertisementProduct.id_product == indexes['product'], 
                AdvertisementProduct.st_varity_seq == indexes['varity-seq'])
    
    def filter_by(self, indexes, filters) -> list:
        where = []
        if 'advertisement' in indexes:
            where.append(AdvertisementProduct.id_advertisement == indexes['advertisement'])
        return where + super().filter_by(indexes, filters)
    
    def json_transform(self, method):
        if method == 'list':
            return '_json_fields_advertisement'
        return None

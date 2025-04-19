from operations.crud_base import Crud
from db.models import AdvertisementProduct
from sqlalchemy.orm import joinedload

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

    def delete(self, indexes) -> tuple[int, dict]:
        # Carrega o AdvertisementProduct com o relacionamento product
        advertisement_product = (
            self._session.query(AdvertisementProduct)
            .options(joinedload(AdvertisementProduct.product))
            .filter(
                AdvertisementProduct.id_advertisement == indexes['advertisement'],
                AdvertisementProduct.id_product == indexes['product'],
                AdvertisementProduct.st_varity_seq == indexes['varity-seq']
            )
            .one()
        )
        
        # Força o carregamento do relacionamento antes de deletar
        _ = advertisement_product.product
        
        # Deleta o registro
        self._session.delete(advertisement_product)
        self._session.flush()
        
        return advertisement_product

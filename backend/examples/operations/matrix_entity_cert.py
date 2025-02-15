from operations.crud_base import Crud
from db.models import EntityAttr, MatrixEntity

class MatrixEntityCertCrud(Crud):
    def get_model(self) -> EntityAttr:
        return EntityAttr
    
    def to_model(self, indexes, data):
        cert_model = []
        id_entity = indexes["entity"]
        for key, value in data.items():
            cert_model.append(
                EntityAttr(
                    id_entity=id_entity,
                    id_attr=key,
                    st_value=value
                )
            )

        return cert_model
    
    def update(self, indexes, data):
        self.delete(indexes)
        return self.to_model(indexes, data)

    def delete(self, indexes):
        model = self.list(indexes, {})
        self._session \
            .query(EntityAttr) \
            .filter(
                MatrixEntity.id_account == indexes["account"],
                EntityAttr.id_entity == indexes["entity"],
                EntityAttr.id_attr.ilike("cert\\_%", escape="\\")
            ) \
            .delete()
        return model
    
    def get_joins(self, indexes, filters):
        return ((MatrixEntity, MatrixEntity.id_entity == EntityAttr.id_entity,),)
    
    def filter_by(self, indexes, filters):
        return (
            MatrixEntity.id_account == indexes["account"],
            EntityAttr.id_entity == indexes["entity"],
            EntityAttr.id_attr.ilike("cert\\_%", escape="\\")
        )

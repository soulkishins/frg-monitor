from operations.crud_base import Crud
from db.models import MatrixEntity, MatrixAccount, Entity, EntityAttr
from sqlalchemy.orm import contains_eager

class MatrixEntityCrud(Crud):
    def get_model(self) -> MatrixEntity:
        return MatrixEntity
    
    def to_model(self, indexes, data):
        entity_attr = []
        entity_data = data['entity']

        if 'attributes' in entity_data:
            attrs = entity_data.pop('attributes')  # Remove attr from data
            for attr in attrs:
                entity_attr.append(EntityAttr(**attr)) 

        entity = Entity(
            **entity_data,
            attributes = entity_attr
        )

        return MatrixEntity(
            id_account=indexes['account'],
            entity=entity
        )
    
    def update(self, index, data) -> MatrixEntity:
        model = self.read(index)
        if model:
            self.set_attr(model, data, ('entity','account'))
            if data.get('entity', None):
                entity_data = data.get('entity')
                self.set_attr(model.entity, entity_data, ('attributes',))
                if entity_data.get('attributes', None):
                    attributes = model.entity.attributes
                    if not attributes:
                        model.entity.attributes = attributes = []
                    attributes_to_remove = []
                    for attribute in attributes:
                        attr = next((attr_data for attr_data in entity_data.get('attributes') if attribute.id_attr == attr_data["id_attr"]), None)
                        if attr:
                            attributes.st_value = attr["st_value"]
                            entity_data.get('attributes').remove(attr)
                        else:
                            attributes_to_remove.append(attribute)
                    for attribute in attributes_to_remove:
                        attributes.remove(attribute)
                    for attr_data in entity_data.get('attributes'):
                        attributes.append(EntityAttr(**attr_data))
            return model
        return None

    def get_options(self) -> list:
        return (contains_eager(MatrixEntity.account), contains_eager(MatrixEntity.entity).contains_eager(Entity.attributes))

    def get_joins(self, indexes, filters):
        return (MatrixEntity.account, MatrixEntity.entity, Entity.attributes)

    def filter_by_pk(self, indexes) -> list:
        return (MatrixEntity.id_account == indexes['account'],MatrixEntity.id_entity == indexes['entity'])

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'account' in indexes:
            where.append(MatrixEntity.id_account == indexes['account'])

        if 'st_account_name' in filters:
            where.append(MatrixAccount.st_name.ilike(f"%{filters['st_account_name']}%"))
        if 'st_url' in filters:
            where.append(MatrixAccount.st_url.ilike(f"%{filters['st_url']}%"))
        if 'st_entity_name' in filters:
            where.append(Entity.st_name.ilike(f"%{filters['st_entity_name']}%"))
        if 'document' in filters:
            where.append(Entity.st_document == filters['document'])
            where.append(Entity.st_document_type == filters['document_type'])
        if 'st_email' in filters:
            where.append(Entity.st_email.ilike(f"%{filters['st_email']}%"))
        if 'st_phone' in filters:
            where.append(Entity.st_phone.ilike(f"%{filters['st_phone']}%"))
        if 'st_status' in filters:
            where.append(Entity.st_status == filters['st_status'])

        return where + super().filter_by(indexes, filters)
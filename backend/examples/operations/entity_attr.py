from operations.crud_base import Crud
from db.models import EntityAttr

class EntityAttrCrud(Crud):
    def get_model(self) -> EntityAttr:
        return EntityAttr

    def filter_by_pk(self, indexes) -> list:
        return (EntityAttr.id_entity == indexes["entity"], EntityAttr.id_entity == indexes["attr"])

    def filter_by(self, indexes, filters) -> list:
        where = []
        if 'entity' in indexes:
            EntityAttr.id_entity == indexes["entity"]
        if 'st_value' in filters:
            where.append(EntityAttr.st_value.ilike(f"%{filters['st_value']}%"))
        return where
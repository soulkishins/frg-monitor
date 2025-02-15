from operations.crud_base import Crud
from db.models import Entity, EntityAttr
from sqlalchemy.orm import contains_eager

class EntityCrud(Crud):
    def get_model(self) -> Entity:
        return Entity

    def filter_by_pk(self, indexes) -> list:
        return (Entity.id == indexes['entity'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'st_name' in filters:
            where.append(Entity.st_name.ilike(f"%{filters['st_name']}%"))
        if 'document' in filters:
            where.append(Entity.st_document == filters['document'])
            where.append(Entity.st_document_type == filters['document_type'])
        if 'st_email' in filters:
            where.append(Entity.st_email.ilike(f"%{filters['st_email']}%"))
        if 'st_phone' in filters:
            where.append(Entity.st_phone.ilike(f"%{filters['st_phone']}%"))

        return where + super().filter_by(indexes, filters)
from operations.crud_base import Crud
from db.models import MatrixUserEntity, MatrixAccount, User, Entity
from sqlalchemy.orm import contains_eager

class MatrixUserEntityCrud(Crud):
    def get_model(self) -> MatrixUserEntity:
        return MatrixUserEntity

    def get_options(self) -> list:
        return (contains_eager(MatrixUserEntity.account), contains_eager(MatrixUserEntity.user), contains_eager(MatrixUserEntity.entity))

    def get_joins(self, indexes, filters):
        return (MatrixUserEntity.account, MatrixUserEntity.user, MatrixUserEntity.entity)

    def filter_by_pk(self, indexes) -> list:
         return (MatrixUserEntity.id_account == indexes['account'], MatrixUserEntity.id_user == indexes['user'], MatrixUserEntity.id_entity == indexes['entity'])

    def filter_by(self, indexes, filters) -> list:
        where = []
        if 'account' in indexes:
            where.append(MatrixUserEntity.id_account == indexes['account'])

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
        
        if 'st_user_name' in filters:
            where.append(User.st_name.ilike(f"%{filters['st_user_name']}%"))
        if 'st_email' in filters:
            where.append(User.st_email.ilike(f"%{filters['st_email']}%"))
        if 'st_phone' in filters:
            where.append(User.st_phone.ilike(f"%{filters['st_phone']}%"))
        return where
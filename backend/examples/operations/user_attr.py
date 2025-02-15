from operations.crud_base import Crud
from db.models import UserAttr

class UserAttrCrud(Crud):
    def get_model(self) -> UserAttr:
        return UserAttr

    def filter_by_pk(self, indexes) -> list:
        return (UserAttr.id_user == indexes["user"], UserAttr.id_user == indexes["attr"])

    def filter_by(self, indexes, filters) -> list:
        where = []
        if 'user' in indexes:
            UserAttr.id_user == indexes["user"]
        if 'st_value' in filters:
            where.append(UserAttr.st_value.ilike(f"%{filters['st_value']}%"))
        return where
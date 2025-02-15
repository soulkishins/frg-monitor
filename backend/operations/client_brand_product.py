from operations.crud_base import Crud
from db.models import User, UserAttr
from sqlalchemy.orm import contains_eager

class UserCrud(Crud):
    def get_model(self) -> User:
        return User

    def filter_by_pk(self, indexes) -> list:
        return (User.id == indexes['user'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'st_name' in filters:
            where.append(User.st_name.ilike(f"%{filters['st_name']}%"))
        if 'st_email' in filters:
            where.append(User.st_email.ilike(f"%{filters['st_email']}%"))
        if 'st_phone' in filters:
            where.append(User.st_phone.ilike(f"%{filters['st_phone']}%"))

        return where + super().filter_by(indexes, filters)
from operations.crud_base import Crud
from db.models import MatrixUser, MatrixAccount, User, UserAttr
from sqlalchemy.orm import contains_eager

class MatrixUserCrud(Crud):
    def get_model(self) -> MatrixUser:
        return MatrixUser

    def to_model(self, indexes, data):
        user_attr = []
        user_data = data.get('user', {})

        if 'attributes' in user_data:
            attrs = user_data.pop('attributes')  # Remove attr from data
            for attr in attrs:
                user_attr.append(UserAttr(**attr)) 

        user = None
        if 'user' in data:
            user = User(
                **user_data,
                attributes = user_attr
            )

            return MatrixUser(
                id_account=indexes['account'],
                user=user,
                st_permission=data['st_permission']
            )
        return MatrixUser(
            id_account=indexes['account'],
            id_user=data['id_user'],
            st_permission=data['st_permission']
        )
    
    def update(self, index, data) -> MatrixUser:
        model = self.read(index)
        if model:
            self.set_attr(model, data, ('user','account'))
            if 'sub' not in model.user.attributes:
                if data.get('user', None):
                    user_data = data.get('user')
                    self.set_attr(model.user, user_data, ('attributes',))
                    if user_data.get('attributes', None):
                        attributes = model.user.attributes
                        if not attributes:
                            model.user.attributes = attributes = []
                        attributes_to_remove = []
                        for attribute in attributes:
                            attr = next((attr_data for attr_data in user_data.get('attributes') if attribute.id_attr == attr_data["id_attr"]), None)
                            if attr:
                                attributes.st_value = attr["st_value"]
                                user_data.get('attributes').remove(attr)
                            else:
                                attributes_to_remove.append(attribute)
                        for attribute in attributes_to_remove:
                            attributes.remove(attribute)
                        for attr_data in user_data.get('attributes'):
                            attributes.append(UserAttr(**attr_data))
            return model
        return None

    def get_options(self) -> list:
        return (contains_eager(MatrixUser.account), contains_eager(MatrixUser.user).contains_eager(User.attributes))
    
    def get_joins(self, indexes, filters):
        return (MatrixUser.account, MatrixUser.user, User.attributes)
    
    def filter_by_pk(self, indexes) -> list:
        return (MatrixUser.id_account == indexes['account'],MatrixUser.id_user == indexes['user'])

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'account' in indexes:
            where.append(MatrixUser.id_account == indexes['account'])

        if 'st_account_name' in filters:
            where.append(MatrixAccount.st_name.ilike(f"%{filters['st_account_name']}%"))
        if 'st_url' in filters:
            where.append(MatrixAccount.st_url.ilike(f"%{filters['st_url']}%"))
        if 'st_user_name' in filters:
            where.append(User.st_name.ilike(f"%{filters['st_user_name']}%"))
        if 'st_email' in filters:
            where.append(User.st_email.ilike(f"%{filters['st_email']}%"))
        if 'st_phone' in filters:
            where.append(User.st_phone.ilike(f"%{filters['st_phone']}%"))

        return where + super().filter_by(indexes, filters)
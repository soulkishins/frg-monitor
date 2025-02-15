from operations.crud_base import Crud
from db.models import User, UserAttr
from sqlalchemy.orm import contains_eager

class ProfileCrud(Crud):
    def get_model(self) -> User:
        return User
    
    def update(self, index, data) -> User:
        model = self.read(index)
        if model:
            self.set_attr(model, data, ('attributes',))
            if data.get('attributes', None):
                attributes = model.attributes
                if not attributes:
                    model.attributes = attributes = []
                attributes_to_remove = []
                for attribute in attributes:
                    attr = next((attr_data for attr_data in data.get('attributes') if attribute.id_attr == attr_data["id_attr"]), None)
                    if attr:
                        attributes.st_value = attr["st_value"]
                        data.get('attributes').remove(attr)
                    else:
                        attributes_to_remove.append(attribute)
                for attribute in attributes_to_remove:
                    attributes.remove(attribute)
                for attr_data in data.get('attributes'):
                    attributes.append(UserAttr(**attr_data))
            return model
        return None

    def get_options(self) -> list:
        return (contains_eager(User.attributes),)

    def get_joins(self, indexes, filters):
        return (User.attributes,)

    def filter_by_pk(self, indexes) -> list:
        return (User.id == indexes['id_user'],)

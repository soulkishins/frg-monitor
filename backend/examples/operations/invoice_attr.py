from operations.crud_base import Crud
from db.models import InvoiceAttr
from sqlalchemy.orm import contains_eager

class InvoiceAttrCrud(Crud):
    def get_model(self) -> InvoiceAttr:
        return InvoiceAttr

    def has_options(self) -> bool:
        return True

    def get_options(self) -> list:
        return [contains_eager(InvoiceAttr.attributes)]

    def filter_by_pk(self, indexes) -> list:
        return (InvoiceAttr.id == indexes.InvoiceAttr,)

    def has_filters(self, indexes, filters) -> bool:
        return filters and len(filters.items()) > 0

    def filter_by(self, indexes, filters) -> list:
        where = []
        if 'id' in filters:
            where.append(InvoiceAttr.id == filters['id'])
        if 'st_name' in filters:
            where.append(InvoiceAttr.st_name.ilike(f"%{filters['st_name']}%"))
        if 'st_email' in filters:
            where.append(InvoiceAttr.st_email.ilike(f"%{filters['st_email']}%"))
        if 'st_status' in filters:
            where.append(InvoiceAttr.st_status == filters['st_status'])
        return where
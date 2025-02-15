from operations.crud_base import Crud
from db.models import Invoice
from sqlalchemy.orm import contains_eager

class InvoiceCrud(Crud):
    def get_model(self) -> Invoice:
        return Invoice

    def filter_by_pk(self, indexes) -> list:
        return (Invoice.id == indexes['invoice'],)

    def filter_by(self, indexes, filters) -> list:
        where = []
        if 'id' in filters:
            where.append(Invoice.id == filters['id'])
        if 'st_name' in filters:
            where.append(Invoice.st_name.ilike(f"%{filters['st_name']}%"))
        if 'st_email' in filters:
            where.append(Invoice.st_email.ilike(f"%{filters['st_email']}%"))
        if 'st_status' in filters:
            where.append(Invoice.st_status == filters['st_status'])
        return where
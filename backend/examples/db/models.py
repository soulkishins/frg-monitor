from db.db import get_current_user as user
from sqlalchemy import Column, String, BOOLEAN, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, as_declarative
import uuid
import datetime
import json

def str_or_dict(obj, *, full=False) -> dict:
    if not obj:
        return None

    if isinstance(obj, (UUID, uuid.UUID, datetime.datetime)):
        return str(obj)
    
    if isinstance(obj, Base):
        return obj.to_dict() if not full else obj.to_full_dict()
    
    if isinstance(obj, list):
        return [o.to_dict() if not full else o.to_full_dict() for o in obj]

    return obj

@as_declarative()
class Base:
    def to_dict(self):
        return {key: str_or_dict(getattr(self, key)) for key in self._json_fields()}
    
    def to_full_dict(self):
        return {key: str_or_dict(getattr(self, key), full=True) for key in self._full_json_fields()}
    
    def _full_json_fields(self):
        return self._json_fields()

    def __str__(self):
        return json.dumps(self.to_dict(), default=str)

Base.metadata.schema = "notas"

# Colunas de Audit Padronizadas
class Audit:
    dt_created = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=None)
    st_created_by = Column(String, default=user, onupdate=None)
    dt_modified = Column(TIMESTAMP, onupdate=func.current_timestamp())
    st_modified_by = Column(String, onupdate=user)
    in_deleted = Column(BOOLEAN, default=False)
    dt_deleted = Column(TIMESTAMP)
    st_deleted_by = Column(String)
    
    def delete(self):
        self.in_deleted = True
        self.dt_deleted = func.current_timestamp()
        self.st_deleted_by = user()

    def _json_fields(self):
        return ("dt_created", "st_created_by", "dt_modified", "st_modified_by", "in_deleted", "dt_deleted", "st_deleted_by")

class MatrixAccount(Base, Audit):
    __tablename__ = "tb_matrix_account"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    st_name = Column(String, nullable=False)
    st_url = Column(String, nullable=False, unique=True)

    users = relationship("MatrixUser", back_populates="account", lazy=True)
    entities = relationship("MatrixEntity", back_populates="account", lazy=True)
    
    def _json_fields(self):
        return ("id", "st_name", "st_url") + super()._json_fields()

class MatrixUser(Base, Audit):
    __tablename__ = "tb_matrix_user"
    
    id_account = Column(UUID(as_uuid=True), ForeignKey(MatrixAccount.id), primary_key=True, nullable=False)
    id_user = Column(UUID(as_uuid=True), ForeignKey("tb_user.id"), primary_key=True, nullable=False)
    st_permission = Column(String, nullable=False)

    account = relationship("MatrixAccount", back_populates="users", lazy=True)
    user = relationship("User", lazy=True)
    
    def _json_fields(self):
        return ("id_account", "id_user", "st_permission", "account", "user") + super()._json_fields()

class MatrixEntity(Base, Audit):
    __tablename__ = "tb_matrix_entity"
    
    id_account = Column(UUID(as_uuid=True), ForeignKey(MatrixAccount.id), primary_key=True, nullable=False)
    id_entity = Column(UUID(as_uuid=True), ForeignKey("tb_entity.id"), primary_key=True, nullable=False)

    account = relationship("MatrixAccount", back_populates="entities", lazy=True)
    entity = relationship("Entity", lazy=True, cascade="save-update, merge", single_parent=True)
    
    def _json_fields(self):
        return ("id_account", "id_entity", "account", "entity") + super()._json_fields()

class MatrixUserEntity(Base, Audit):
    __tablename__ = "tb_matrix_user_entity"
    
    id_account = Column(UUID(as_uuid=True), ForeignKey(MatrixAccount.id), primary_key=True, nullable=False)
    id_user = Column(UUID(as_uuid=True), ForeignKey("tb_user.id"), primary_key=True, nullable=False)
    id_entity = Column(UUID(as_uuid=True), ForeignKey("tb_entity.id"), primary_key=True, nullable=False)

    account = relationship("MatrixAccount", lazy=True)
    user = relationship("User", lazy=True)
    entity = relationship("Entity", lazy=True)
    
    def _json_fields(self):
        return ("id_account", "id_user", "id_entity") + super()._json_fields()

class User(Base, Audit):
    __tablename__ = "tb_user"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    st_name = Column(String, nullable=False)
    st_email = Column(String, nullable=False, unique=True)
    st_phone = Column(String)

    attributes = relationship("UserAttr", back_populates="user", lazy=True, cascade="all, delete-orphan")
    
    def _json_fields(self):
        return ("id", "st_name", "st_email", "st_phone", "attributes") + super()._json_fields()

class UserAttr(Base):
    __tablename__ = "tb_user_attr"
    
    id_user = Column(UUID(as_uuid=True), ForeignKey(User.id), primary_key=True, nullable=False)
    id_attr = Column(String, primary_key=True, nullable=False)
    st_value = Column(String, nullable=False)

    user = relationship("User", back_populates="attributes", lazy=True, innerjoin=True)

    def _json_fields(self):
        return ("id_user", "id_attr", "st_value")

class Entity(Base, Audit):
    __tablename__ = "tb_entity"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    st_document = Column(String, nullable=False)
    st_document_type = Column(String, nullable=False)
    st_name = Column(String, nullable=False)
    st_email = Column(String)
    st_phone = Column(String)
    st_status = Column(String)

    attributes = relationship("EntityAttr", back_populates="entity", lazy=True, cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="entity", lazy=True)

    def _json_fields(self):
        return ("id", "st_document", "st_document_type", "st_name", "st_email", "st_phone", "st_status", "attributes") + super()._json_fields()

class EntityAttr(Base):
    __tablename__ = "tb_entity_attr"
    
    id_entity = Column(UUID(as_uuid=True), ForeignKey(Entity.id), primary_key=True, nullable=False)
    id_attr = Column(String, primary_key=True, nullable=False)
    st_value = Column(String, nullable=False)
    
    entity = relationship("Entity", back_populates="attributes", lazy=True, innerjoin=True)
    
    def _json_fields(self):
        return ("id_entity", "id_attr", "st_value")

class Invoice(Base, Audit):
    __tablename__ = "tb_invoice"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    st_invoice_code = Column(String, nullable=False)
    st_invoice_type = Column(String, nullable=False)
    id_entity = Column(UUID(as_uuid=True), ForeignKey(Entity.id), nullable=False)
    st_payer = Column(String)
    st_issuer = Column(String, nullable=False)
    st_carrier = Column(String)
    st_status = Column(String, nullable=False)
    st_reason = Column(String)
    dt_invoice = Column(TIMESTAMP, nullable=False)
    
    entity = relationship("Entity", back_populates="invoices", lazy=True, innerjoin=True)
    attributes = relationship("InvoiceAttr", back_populates="invoice", lazy=True)
    
    def _json_fields(self):
        return ("id", "st_invoice_code", "st_invoice_type", "id_entity", "st_payer", "st_issuer", "st_carrier", "st_status", "st_reason", "dt_invoice", "entity") + super()._json_fields()

    def _full_json_fields(self):
        return ("id", "st_invoice_code", "st_invoice_type", "id_entity", "st_payer", "st_issuer", "st_carrier", "st_status", "st_reason", "dt_invoice", "entity", "attributes") + super()._json_fields()

class InvoiceAttr(Base):
    __tablename__ = "tb_invoice_attr"
    
    id_invoice = Column(UUID(as_uuid=True), ForeignKey(Invoice.id), primary_key=True, nullable=False)
    id_attr = Column(String, primary_key=True, nullable=False)
    st_value = Column(String, nullable=False)
    
    invoice = relationship("Invoice", back_populates="attributes", lazy=True, innerjoin=True)
    
    def _json_fields(self):
        return ("id_invoice", "id_attr", "st_value")

class InvoiceDocs(Base, Audit):
    __tablename__ = "tb_invoice_docs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    id_entity = Column(UUID(as_uuid=True), ForeignKey(Entity.id), nullable=False)
    id_invoice = Column(UUID(as_uuid=True), ForeignKey(Invoice.id))
    st_invoice_code = Column(String, nullable=False)
    st_invoice_type = Column(String, nullable=False)
    st_doctype = Column(String, nullable=False)
    st_filename = Column(String, nullable=False)

    entity = relationship("Entity", lazy=True, innerjoin=True)
    invoice = relationship("Invoice", lazy=True)
    
    def _json_fields(self):
        return ("id", "id_entity", "id_invoice", "st_invoice_code", "st_invoice_type", "st_doctype", "st_filename") + super()._json_fields()

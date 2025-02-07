from db.db import get_current_user as user
from sqlalchemy import Column, String, INT, BOOLEAN, TIMESTAMP, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, as_declarative
import uuid

@as_declarative()
class Base:
    __table_args__ = {'schema': 'notas'}

# Colunas de Audit Padronizadas
class Audit:
    dt_created = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=None) # Não pode ser atualizado
    st_created_by = Column(String, default=user, onupdate=None) # Não pode ser atualizado
    dt_modified = Column(TIMESTAMP, onupdate=func.current_timestamp())
    st_modified_by = Column(String, onupdate=user)
    in_deleted = Column(BOOLEAN, default=False)
    dt_deleted = Column(TIMESTAMP)
    st_deleted_by = Column(String)
    
    def delete(self):
        self.in_deleted = True
        self.dt_deleted = func.current_timestamp()
        self.st_deleted_by = user()

# Definição das tabelas
class User(Base, Audit):
    __tablename__ = "tb_user"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False, onupdate=None) # Não pode ser atualizado
    st_name = Column(String, nullable=False)
    st_email = Column(String, nullable=False, unique=True, onupdate=None) # Não pode ser atualizado
    st_phone = Column(String)

    attributes = relationship("UserAttr", back_populates="user", lazy=True)

class UserAttr(Base, Audit):
    __tablename__ = "tb_user_attr"
    
    id_user = Column(UUID(as_uuid=True), ForeignKey(User.id), primary_key=True, nullable=False, onupdate=None) # Não pode ser atualizado
    id_attr = Column(String, primary_key=True, nullable=False, onupdate=None) # Não pode ser atualizado
    st_value = Column(String, nullable=False)
    
    user = relationship("User", back_populates="attributes", lazy=True, innerjoin=True)

class Entity(Base, Audit):
    __tablename__ = "tb_entity"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False, onupdate=None) # Não pode ser atualizado
    st_document = Column(String, nullable=False, onupdate=None) # Não pode ser atualizado
    st_document_type = Column(String, nullable=False, onupdate=None) # Não pode ser atualizado
    st_name = Column(String, nullable=False)
    st_email = Column(String)
    st_phone = Column(String)
    st_status = Column(String)
    
    #__table_args__ = (UniqueConstraint("st_document", "st_document_type", name="uq_entity"),)

    attributes = relationship("EntityAttr", back_populates="entity", lazy=True)
    invoices = relationship("Invoice", back_populates="entity", lazy=True)

class EntityAttr(Base, Audit):
    __tablename__ = "tb_entity_attr"
    
    id_entity = Column(UUID(as_uuid=True), ForeignKey(Entity.id), primary_key=True, nullable=False, onupdate=None) # Não pode ser atualizado
    id_attr = Column(String, primary_key=True, nullable=False, onupdate=None) # Não pode ser atualizado
    st_value = Column(String, nullable=False)
    
    entity = relationship("Entity", back_populates="attributes", lazy=True, innerjoin=True)

class Invoice(Base, Audit):
    __tablename__ = "tb_invoice"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False, onupdate=None) # Não pode ser atualizado
    st_invoice_code = Column(String, nullable=False, onupdate=None) # Não pode ser atualizado
    st_invoice_type = Column(String, nullable=False, onupdate=None) # Não pode ser atualizado
    id_entity = Column(UUID(as_uuid=True), ForeignKey(Entity.id), nullable=False, onupdate=None) # Não pode ser atualizado
    st_payer = Column(String) # Não pode ser atualizado
    st_issuer = Column(String, nullable=False, onupdate=None) # Não pode ser atualizado
    st_carrier = Column(String)
    st_status = Column(String, nullable=False)
    st_reason = Column(String)
    dt_invoice = Column(TIMESTAMP, nullable=False)
    
    #__table_args__ = (UniqueConstraint("st_invoice_code", "st_invoice_type", name="uq_invoice"),)
    
    entity = relationship("Entity", back_populates="invoices", lazy=True, innerjoin=True)
    attributes = relationship("InvoiceAttr", back_populates="invoice", lazy=True)

class InvoiceAttr(Base, Audit):
    __tablename__ = "tb_invoice_attr"
    
    id_invoice = Column(UUID(as_uuid=True), ForeignKey(Invoice.id), primary_key=True, nullable=False, onupdate=None) # Não pode ser atualizado
    id_attr = Column(String, primary_key=True, nullable=False, onupdate=None) # Não pode ser atualizado
    st_value = Column(String, nullable=False)
    
    invoice = relationship("Invoice", back_populates="attributes", lazy=True, innerjoin=True)

class InvoiceDocs(Base, Audit):
    __tablename__ = "tb_invoice_docs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False, onupdate=None) # Não pode ser atualizado
    id_entity = Column(UUID(as_uuid=True), ForeignKey(Entity.id), nullable=False, onupdate=None) # Não pode ser atualizado
    id_invoice = Column(UUID(as_uuid=True), ForeignKey(Invoice.id))
    st_invoice_code = Column(String, nullable=False, onupdate=None) # Não pode ser atualizado
    st_invoice_type = Column(String, nullable=False, onupdate=None) # Não pode ser atualizado
    st_doctype = Column(String, nullable=False)
    st_filename = Column(String, nullable=False)

    entity = relationship("Entity", lazy=True, innerjoin=True)
    invoice = relationship("Invoice", lazy=True)

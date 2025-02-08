from db.db import get_current_user as user
from sqlalchemy import Column, String, INT, BOOLEAN, TIMESTAMP, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
import uuid

Base = declarative_base()
Base.metadata.schema = "invoices"

class Audit:
    dt_created = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=None) # Não pode ser atualizado
    st_created_by = Column(String, default=user, onupdate=None) # Não pode ser atualizado
    dt_modified = Column(TIMESTAMP, onupdate=func.current_timestamp())
    st_modified_by = Column(String, onupdate=user)

class User(Base, Audit):
    __tablename__ = "tb_user"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    st_name = Column(String, nullable=False)
    st_email = Column(String, nullable=False, unique=True, onupdate=None)
    st_phone = Column(String)
    
    attributes = relationship("UserAttr", back_populates="user", lazy=True)

class UserAttr(Base, Audit):
    __tablename__ = "tb_user_attr"
    
    id_user = Column(UUID(as_uuid=True), ForeignKey("invoices.tb_user.id"), primary_key=True, onupdate=None)
    id_attr = Column(String, primary_key=True, onupdate=None)
    st_value = Column(String, nullable=False)
    
    user = relationship("User", back_populates="attributes", lazy=True)

class Category(Base, Audit):
    __tablename__ = "tb_category"
    
    id_category = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    st_category = Column(String, nullable=False)
    st_status = Column(String, nullable=False)
    
    subcategories = relationship("Subcategory", back_populates="category", lazy=True)

class Subcategory(Base, Audit):
    __tablename__ = "tb_subcategory"
    
    id_subcategory = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_category = Column(UUID(as_uuid=True), ForeignKey("invoices.tb_category.id_category"), nullable=False)
    st_subcategory = Column(String, nullable=False)
    st_status = Column(String, nullable=False)
    
    category = relationship("Category", back_populates="subcategories", lazy=True)

class Client(Base, Audit):
    __tablename__ = "tb_client"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    st_name = Column(String, nullable=False)
    st_document = Column(String, nullable=False, unique=True)
    st_status = Column(String, nullable=False)

class ClientBrand(Base, Audit):
    __tablename__ = "tb_client_brand"
    
    id_brand = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_client = Column(UUID(as_uuid=True), ForeignKey("invoices.tb_client.id"), nullable=False)
    st_brand = Column(String, nullable=False)
    st_status = Column(String, nullable=False)
    
    client = relationship("Client", lazy=True)

class ClientBrandProduct(Base, Audit):
    __tablename__ = "tb_client_brand_product"
    
    id_product = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_brand = Column(UUID(as_uuid=True), ForeignKey("invoices.tb_client_brand.id_brand"), nullable=False)
    id_subcategory = Column(UUID(as_uuid=True), ForeignKey("invoices.tb_subcategory.id_subcategory"), nullable=False)
    st_product = Column(String, nullable=False)
    st_variety = Column(String, nullable=False)
    st_status = Column(String, nullable=False)

class Keyword(Base, Audit):
    __tablename__ = "tb_keyword"
    
    id_keyword = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_brand = Column(UUID(as_uuid=True), ForeignKey("invoices.tb_client_brand.id_brand"), nullable=False, onupdate=None)
    st_keyword = Column(String, nullable=False)
    st_product = Column(String, nullable=False)
    st_status = Column(String, nullable=False)

class Advertisement(Base, Audit):
    __tablename__ = "tb_advertisement"
    
    id_advertisement = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_brand = Column(UUID(as_uuid=True), ForeignKey("invoices.tb_client_brand.id_brand"), nullable=False, onupdate=None)
    st_plataform = Column(String, nullable=False)
    st_url = Column(String, nullable=False)
    st_title = Column(String, nullable=False)
    st_description = Column(String, nullable=False)
    st_photos = Column(String, nullable=False)
    db_price = Column(Numeric(10, 2), nullable=False)
    st_vendor = Column(String, nullable=False)
    st_details = Column(String)
    st_status = Column(String, nullable=False)

class AdvertisementProduct(Base, Audit):
    __tablename__ = "tb_advertisement_product"
    
    id_advertisement = Column(UUID(as_uuid=True), ForeignKey("invoices.tb_advertisement.id_advertisement"), primary_key=True, onupdate=None)
    id_product = Column(UUID(as_uuid=True), ForeignKey("invoices.tb_client_brand_product.id_product"), primary_key=True, onupdate=None)
    st_varity_seq = Column(String, nullable=False, onupdate=None)
    st_varity_name = Column(String, nullable=False, onupdate=None)

class AdvertisementHistory(Base, Audit):
    __tablename__ = "tb_advertisement_history"
    
    id_advertisement = Column(UUID(as_uuid=True), ForeignKey("invoices.tb_advertisement.id_advertisement"), primary_key=True, onupdate=None)
    dt_history = Column(TIMESTAMP, primary_key=True, onupdate=None)
    st_status = Column(String, nullable=False)
    st_action = Column(String, nullable=False)

from db.db import get_current_user as user
from sqlalchemy import Column, String, FLOAT, TIMESTAMP, ForeignKey, func, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import as_declarative, relationship
import uuid
import datetime
import json
import os

def str_or_dict(obj, *, custom = None) -> dict:
    if not obj:
        return None

    if isinstance(obj, (UUID, uuid.UUID, datetime.datetime)):
        return str(obj)
    
    if isinstance(obj, Base):
        return obj.to_dict() if not custom else obj.to_custom_dict(custom)
    
    if isinstance(obj, list):
        return [o.to_dict() if not custom else o.to_custom_dict(custom) for o in obj]

    return obj

@as_declarative()
class Base:
    def to_dict(self):
        return {key: str_or_dict(getattr(self, key)) for key in self._json_fields()}
    
    def to_custom_dict(self, custom_fields: str):
        _method = getattr(self, custom_fields, None)
        if not callable(_method):
            return self.to_dict()
        fields = _method()
        return {key: str_or_dict(getattr(self, key), custom=custom_fields) for key in fields}
    
    def _full_json_fields(self):
        return self._json_fields()

    def __str__(self):
        return json.dumps(self.to_dict(), default=str)

Base.metadata.schema = os.getenv("db_schema")

class Audit:
    dt_created = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=None) # Não pode ser atualizado
    st_created_by = Column(String, default=user, onupdate=None) # Não pode ser atualizado
    dt_modified = Column(TIMESTAMP, onupdate=func.current_timestamp())
    st_modified_by = Column(String, onupdate=user)
    
    def to_dict(self):
        return {key: getattr(self, key) for key in self.__dict__ if key != "_sa_instance_state"}
    
    def _json_fields(self):
        return ["dt_created", "st_created_by", "dt_modified", "st_modified_by"] # Campos que serão serializados para JSON

class User(Base, Audit):
    __tablename__ = "tb_user"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    st_name = Column(String, nullable=False)
    st_email = Column(String, nullable=False, unique=True, onupdate=None)
    st_phone = Column(String)
    
    attributes = relationship("UserAttr", back_populates="user", lazy=True)
    
    def _json_fields(self):
        return ["id", "st_name", "st_email", "st_phone"] + super()._json_fields()
    
    def _full_json_fields(self):
        return ["id", "st_name", "st_email", "st_phone", "attributes"] + super()._json_fields()


class UserAttr(Base):
    __tablename__ = "tb_user_attr"
    
    id_user = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_user.id"), primary_key=True, onupdate=None)
    id_attr = Column(String, primary_key=True, onupdate=None)
    st_value = Column(String, nullable=False)
    
    user = relationship("User", back_populates="attributes", lazy=True)
    
    def _json_fields(self):
        return ["id_user", "id_attr", "st_value"]

class Category(Base, Audit):
    __tablename__ = "tb_category"
    
    id_category = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    st_category = Column(String, nullable=False)
    st_status = Column(String, nullable=False)
    
    subcategories = relationship("Subcategory", back_populates="category", lazy=True)
    
    def _json_fields(self):
        return ["id_category", "st_category", "st_status"] + super()._json_fields()
    
    def _json_fields_advertisement(self):
        return ["st_category"]

class Subcategory(Base, Audit):
    __tablename__ = "tb_subcategory"
    
    id_subcategory = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_category = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_category.id_category"), nullable=False)
    st_subcategory = Column(String, nullable=False)
    st_status = Column(String, nullable=False)
    
    category = relationship("Category", back_populates="subcategories", lazy=True)

    def _json_fields(self):
        return ["id_subcategory", "id_category", "st_subcategory", "st_status", "category"] + super()._json_fields()
    
    def _json_fields_advertisement(self):
        return ["st_subcategory", "category"]

class Client(Base, Audit):
    __tablename__ = "tb_client"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    st_name = Column(String, nullable=False)
    st_document = Column(String, nullable=False, unique=True)
    st_status = Column(String, nullable=False)
    bl_pj = Column(Boolean, nullable=False, default=True)

    def _json_fields(self):
        return ["id", "st_name", "st_document", "st_status", "bl_pj"] + super()._json_fields()
    
    def _json_fields_advertisement(self):
        return ["st_name", "st_document"]

class ClientBrand(Base, Audit):
    __tablename__ = "tb_client_brand"
    
    id_brand = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_client = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_client.id"), nullable=False)
    st_brand = Column(String, nullable=False)
    st_status = Column(String, nullable=False)
    
    client = relationship("Client", lazy=True)

    def _json_fields(self):
        return ["id_brand", "id_client", "st_brand", "st_status", "client"] + super()._json_fields()
    
    def _json_fields_advertisement(self):
        return ["st_brand", "client"]

class ClientBrandProduct(Base, Audit):
    __tablename__ = "tb_client_brand_product"
    
    id_product = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_brand = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_client_brand.id_brand"), nullable=False)
    id_subcategory = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_subcategory.id_subcategory"), nullable=False)
    st_product = Column(String, nullable=False)
    st_variety = Column(String, nullable=False)
    st_status = Column(String, nullable=False)

    brand = relationship("ClientBrand", lazy=True)
    subcategory = relationship("Subcategory", lazy=True)

    def _json_fields(self):
        return ["id_product", "id_brand", "id_subcategory", "st_product", "st_variety", "st_status", "subcategory", "brand"] + super()._json_fields()
    
    def _json_fields_advertisement(self):
        return ["st_product", "st_variety", "subcategory"]

class Keyword(Base, Audit):
    __tablename__ = "tb_keyword"
    
    id_keyword = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_brand = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_client_brand.id_brand"), nullable=False, onupdate=None)
    st_keyword = Column(String, nullable=False)
    st_product = Column(String, nullable=False)
    st_status = Column(String, nullable=False)

    brand = relationship("ClientBrand", lazy=True)

    def _json_fields(self):
        return ["id_keyword", "id_brand", "st_keyword", "st_product", "st_status", "brand"] + super()._json_fields()

class Advertisement(Base, Audit):
    __tablename__ = "tb_advertisement"
    
    id_advertisement = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_brand = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_client_brand.id_brand"), nullable=False, onupdate=None)
    st_plataform = Column(String, nullable=False)
    st_plataform_id = Column(String, nullable=False)
    st_url = Column(String, nullable=False)
    st_title = Column(String, nullable=False)
    st_description = Column(String, nullable=False)
    st_photos = Column(String, nullable=False)
    db_price = Column(FLOAT, nullable=False)
    st_vendor = Column(String, nullable=False)
    st_details = Column(String)
    st_status = Column(String, nullable=False)
    bl_reconcile = Column(Boolean, nullable=False, default=False)

    brand = relationship("ClientBrand", lazy=True)
    products = relationship("AdvertisementProduct", back_populates="advertisement", lazy=True)
    history = relationship("AdvertisementHistory", back_populates="advertisement", lazy=True)

    def _json_fields(self):
        return [
            "id_advertisement", "id_brand", "st_plataform", "st_plataform_id",
            "st_url", "st_title", "st_description",
            "st_photos", "db_price", "st_vendor",
            "st_details", "st_status", "brand", "products"
        ] + super()._json_fields()

    def _json_fields_advertisement(self):
        return [
            "id_advertisement", "id_brand", "st_plataform", "st_plataform_id",
            "st_url", "st_title", "st_description",
            "st_photos", "db_price", "st_vendor",
            "st_details", "st_status", "products", "brand"
        ] + super()._json_fields()

class AdvertisementProduct(Base, Audit):
    __tablename__ = "tb_advertisement_product"
    
    id_advertisement = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_advertisement.id_advertisement"), primary_key=True, onupdate=None)
    id_product = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_client_brand_product.id_product"), primary_key=True, onupdate=None)
    st_varity_seq = Column(String, nullable=False, primary_key=True, onupdate=None)
    st_varity_name = Column(String, nullable=False, onupdate=None)
    nr_quantity = Column(Integer, nullable=True)
    en_status = Column(String, nullable=False, default='NR')

    advertisement = relationship("Advertisement", lazy=True)
    product = relationship("ClientBrandProduct", lazy=True)

    def _json_fields(self):
        return ["id_advertisement", "id_product", "st_varity_seq", "st_varity_name", "en_status", "product"] + super()._json_fields()

    def _json_fields_advertisement(self):
        return ["st_varity_seq", "st_varity_name", "en_status", "product", "nr_quantity", "id_product"]

    def _json_fields_resume(self):
        return ["id_product", "st_varity_seq", "st_varity_name", "en_status"]
    
    def __str__(self):
        return json.dumps(self.to_custom_dict('_json_fields_resume'), default=str, indent=4)

class AdvertisementHistory(Base, Audit):
    __tablename__ = "tb_advertisement_history"
    
    id_advertisement = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_advertisement.id_advertisement"), primary_key=True, onupdate=None)
    dt_history = Column(TIMESTAMP, primary_key=True, onupdate=None)
    st_status = Column(String, nullable=False)
    st_action = Column(String, nullable=False)
    st_history = Column(String, nullable=False)

    advertisement = relationship("Advertisement", lazy=True)

    def _json_fields(self):
        return ["id_advertisement", "dt_history", "st_status", "st_action", "st_history"] + super()._json_fields()

    def _json_fields_advertisement(self):
        return ["dt_history", "st_status", "st_action", "st_history", "st_created_by"]

class AdvertisementExport(Base):
    __tablename__ = "tb_advertisement_export"
    
    st_key = Column(String, nullable=False, primary_key=True, onupdate=None)
    dt_created = Column(TIMESTAMP, primary_key=True, onupdate=None)
    st_status = Column(String, nullable=False)

    def _json_fields(self):
        return ["st_key", "dt_created", "st_status"]

class Scheduler(Base, Audit):
    __tablename__ = "tb_scheduler"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_keyword = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_keyword.id_keyword"), nullable=False)
    st_platform = Column(String, nullable=False)
    st_cron = Column(String, nullable=False)
    dt_last_execution = Column(TIMESTAMP)
    
    statistics = relationship("SchedulerStatistics", back_populates="scheduler", lazy=True)

    def _json_fields(self):
        return ["id", "id_keyword", "st_platform", "st_cron", "dt_last_execution"] + super()._json_fields()
    
    def _json_fields_scheduler(self):
        return ["id", "id_keyword", "st_platform", "st_cron", "dt_last_execution", "statistics"]

class SchedulerStatistics(Base):
    __tablename__ = "tb_scheduler_statistics"
    
    id_scheduler = Column(UUID(as_uuid=True), ForeignKey(os.getenv("db_schema") + ".tb_scheduler.id"), primary_key=True)
    dt_created = Column(TIMESTAMP, primary_key=True, default=func.current_timestamp())
    nr_pages = Column(Integer, nullable=False)
    nr_total = Column(Integer, nullable=False)
    nr_processed = Column(Integer, nullable=False)
    nr_created = Column(Integer, nullable=False)
    nr_updated = Column(Integer, nullable=False)
    nr_error = Column(Integer, nullable=False)
    nr_manual_revision = Column(Integer, nullable=False)
    nr_reported = Column(Integer, nullable=False)
    nr_already_reported = Column(Integer, nullable=False)
    nr_reconcile = Column(Integer, nullable=False)
    en_status = Column(String, nullable=False)
    
    scheduler = relationship("Scheduler", back_populates="statistics", lazy=True)

    def _json_fields(self):
        return [
            "id_scheduler", "dt_created", "nr_pages", "nr_total",
            "nr_processed", "nr_created", "nr_updated", "nr_error",
            "nr_manual_revision", "nr_reported", "nr_already_reported"
        ]

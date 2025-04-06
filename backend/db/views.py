from sqlalchemy import Column, String, FLOAT, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from db.models import Base

class VW_Advertisement(Base):
    __tablename__ = "vw_advertisement"
    
    id_advertisement = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, onupdate=None)
    id_client = Column(UUID(as_uuid=True))
    id_brand = Column(UUID(as_uuid=True))
    id_product = Column(String)
    st_plataform = Column(String)
    st_plataform_id = Column(String)
    st_url = Column(String)
    st_name = Column(String)
    st_brand = Column(String)
    st_product = Column(String)
    st_seller = Column(String)
    st_title = Column(String)
    db_price = Column(FLOAT)
    db_original_price = Column(FLOAT)
    st_status = Column(String)

    def _json_fields(self):
        return [
            "id_advertisement",
            "st_plataform",
            "st_plataform_id",
            "st_url",
            "st_name",
            "st_brand",
            "st_product",
            "st_seller",
            "st_title",
            "db_price",
            "db_original_price",
            "st_status"
        ]

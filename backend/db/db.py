import boto3
import json
import contextvars
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_CURRENT_USER = contextvars.ContextVar("user", default=None)
def set_current_user(user: str):
    _CURRENT_USER.set(user)

def get_current_user():
    return _CURRENT_USER.get()

def __get_db_credentials(secret_name, region_name):
    """Recupera as credenciais do banco de dados do AWS Secrets Manager."""
    client = boto3.client('secretsmanager', region_name=region_name)
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

__secret_name = os.getenv('secret_db')
__region_name = os.getenv('secret_region')
# Recuperar credenciais do AWS Secrets Manager
__secret = __get_db_credentials(__secret_name, __region_name)
__database_url = f"postgresql://{__secret['username']}:{__secret['password']}@{__secret['host']}:{__secret.get('port', 5432)}/{__secret['dbname']}"

# Criar conexão com o banco de dados
engine = create_engine(__database_url, pool_size=20, max_overflow=5, pool_timeout=5, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class DB():
    def __init__(self):
        self._session = None

    def __enter__(self):
        self._session = SessionLocal()
        return self._session

    def __exit__(self, exc_type, exc_value, traceback):
        self._session.commit()
        self._session.close()

    @property
    def session(self):
        return self._session

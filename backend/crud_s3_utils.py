import os
import tempfile
import uuid
from boto3 import client as aws
from botocore.exceptions import NoCredentialsError, ClientError

region = os.getenv('s3_region')
s3 = aws('s3', region_name=region)

def get_tmp_file():
    # Caminho da pasta tmp
    return os.path.join(tempfile.gettempdir(), f'{uuid.uuid4()}.tmp')

def listar_arquivos(prefix: str = "", bucket_name: str = None):
    if not bucket_name:
        bucket_name = os.getenv('s3_name')

    """Lista arquivos dentro de um bucket S3, opcionalmente filtrando por um prefixo."""
    response = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
    
    if 'Contents' in response:
        return [obj['Key'] for obj in response['Contents']]
    else:
        return []

def listar_diretorios(prefix: str = "", bucket_name: str = None):
    if not bucket_name:
        bucket_name = os.getenv('s3_name')

    """Lista diretórios dentro de um bucket S3 usando delimitador '/'."""
    response = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix, Delimiter='/')
    
    if 'CommonPrefixes' in response:
        return [obj['Prefix'] for obj in response['CommonPrefixes']]
    else:
        return []

def baixar_arquivo(s3_key: str, local_path: str, bucket_name: str = None):
    if not bucket_name:
        bucket_name = os.getenv('s3_name')

    """Baixa um arquivo do S3 para o sistema local."""
    try:
        s3.download_file(bucket_name, s3_key, local_path)
        print(f"Arquivo {s3_key} baixado para {local_path}")
        return True
    except NoCredentialsError:
        print("Erro: Credenciais AWS não encontradas.")
    except ClientError as e:
        print(f"Erro ao baixar arquivo: {e}")
    return False

def carregar_arquivo(s3_key: str, local_path: str, bucket_name: str = None):
    if not bucket_name:
        bucket_name = os.getenv('s3_name')

    """Faz upload de um arquivo para o S3."""
    try:
        s3.upload_file(local_path, bucket_name, s3_key)
        print(f"Arquivo {local_path} enviado para s3://{bucket_name}/{s3_key}")
        return True
    except NoCredentialsError:
        print("Erro: Credenciais AWS não encontradas.")
    except ClientError as e:
        print(f"Erro ao carregar arquivo: {e}")
    return False


def detalhes_arquivo(s3_key: str, bucket_name: str = None):
    if not bucket_name:
        bucket_name = os.getenv('s3_name')

    """Obtém detalhes de um arquivo no S3."""
    try:
        response = s3.head_object(Bucket=bucket_name, Key=s3_key)
        return response
    except ClientError as e:
        print(f"Erro ao obter detalhes do arquivo: {e}")
        return None
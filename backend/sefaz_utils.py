import os
import requests
import tempfile
from importlib import import_module
from boto3 import client as aws
from botocore.exceptions import NoCredentialsError, ClientError
from services.base_service import BaseService
import xml.etree.ElementTree as ET
import logging

region = os.getenv('s3_region')
s3 = aws('s3', region_name=region)

def config(file: str):
    configFile = f'configs.{file}'
    return import_module(configFile).CONFIGS

def get_cert(entity_id: str):
    # Caminho do certificado e chave do cliente
    base_path = os.path.join(tempfile.gettempdir(), "cert")
    os.makedirs(base_path, exist_ok=True)

    cert = os.path.join(base_path, f"{entity_id}.pem")
    key = os.path.join(base_path, f"{entity_id}.key")

    baixar_arquivo(f'certificados/{entity_id}.pem', cert)
    baixar_arquivo(f'certificados/{entity_id}.key', key)

    return (cert, key)

def get_service_input(service: str):
    # XML da requisição
    with open(f"templates/{service}.msg", "r", encoding="utf-8") as file:
        xml = file.read()

    return xml

def get_service(service: str) -> BaseService:
    return import_module(f'services.{service}').SefazService

def request_soap(entity_id: str, url: str, headers: dict, xml: str):
    result = {
        "body": "",
        "status": 0,
        "error": False
    }
    try:
        # Realiza a requisição com o certificado e a chave
        response = requests.post(
            url,
            data=xml,
            headers=headers,
            cert=get_cert(entity_id),  # Certificado e chave do cliente
            # amazonq-ignore-next-line
            verify=False,  # Verificar o certificado SSL do servidor
            allow_redirects=True  # Permitir redirecionamento
        )

        # Verifica se a resposta foi bem-sucedida
        if response.status_code != 200:
            result["error"] = True
        
        result["status"] = response.status_code
        result["body"] = response.text

    except requests.exceptions.RequestException as e:
        logging.error(f"Erro ao realizar a requisição: {e}")
        result["error"] = True
        result["body"] = e.strerror

    return result

def request_get(entity_id: str, url: str, headers: dict = {}):
    result = {
        "body": "",
        "status": 0,
        "error": False
    }
    try:
        # Realiza a requisição com o certificado e a chave
        response = requests.get(
            url,
            headers=headers,
            cert=get_cert(entity_id),  # Certificado e chave do cliente
            # amazonq-ignore-next-line
            verify=False,  # Verificar o certificado SSL do servidor
            allow_redirects=True  # Permitir redirecionamento
        )

        # Verifica se a resposta foi bem-sucedida
        if response.status_code != 200:
            result["error"] = True
        
        result["status"] = response.status_code
        result["body"] = response.text

    except requests.exceptions.RequestException as e:
        logging.error(f"Erro ao realizar a requisição: {e}")
        result["error"] = True
        result["body"] = e.strerror

    return result

def xml_to_dict(xml_body: str) -> dict:
    try:
        # Parse XML file
        # amazonq-ignore-next-line
        root = ET.fromstring(xml_body)

        # Create dictionary to store all tag values
        event_data = {}
        
        # Function to recursively extract all tags and their values
        def extract_tags(element, data_dict):
            for child in element:
                # Remove namespace from tag name if present
                tag_name = child.tag.split('}')[-1]
                
                if len(child) > 0:
                    # If element has children, create a nested dictionary
                    data_dict[tag_name] = {}
                    extract_tags(child, data_dict[tag_name])
                else:
                    # Store the text value, default to empty string if None
                    data_dict[tag_name] = child.text or ''
                
                # Extract attributes if present
                if child.attrib:
                    data_dict[f"{tag_name}_attributes"] = child.attrib
        
        # Start extraction from root
        extract_tags(root, event_data)
        
        return event_data
        
    except ET.ParseError as e:
        raise ValueError(f"Invalid XML format: {str(e)}")
    except Exception as e:
        # amazonq-ignore-next-line
        raise Exception(f"Error reading event XML: {str(e)}")

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
        logging.debug(f"Arquivo {s3_key} baixado para {local_path}")
        return True
    except NoCredentialsError:
        logging.error("Erro: Credenciais AWS não encontradas.")
    except ClientError as e:
        logging.error(f"Erro ao baixar arquivo: {e}")
    return False

def carregar_arquivo(s3_key: str, local_path: str, bucket_name: str = None):
    if not bucket_name:
        bucket_name = os.getenv('s3_name')

    """Faz upload de um arquivo para o S3."""
    try:
        s3.upload_file(local_path, bucket_name, s3_key)
        logging.debug(f"Arquivo {local_path} enviado para s3://{bucket_name}/{s3_key}")
        return True
    except NoCredentialsError:
        logging.error("Erro: Credenciais AWS não encontradas.")
    except ClientError as e:
        logging.error(f"Erro ao carregar arquivo: {e}")
    return False


def detalhes_arquivo(s3_key: str, bucket_name: str = None):
    if not bucket_name:
        bucket_name = os.getenv('s3_name')

    """Obtém detalhes de um arquivo no S3."""
    try:
        response = s3.head_object(Bucket=bucket_name, Key=s3_key)
        return response
    except ClientError as e:
        logging.error(f"Erro ao obter detalhes do arquivo: {e}")
        return None
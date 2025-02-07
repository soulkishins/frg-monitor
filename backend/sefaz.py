import logging.handlers
import sefaz_utils as utils
import logging
import urllib3
import traceback
import os
import sys
import json

class PrintLikeHandler(logging.StreamHandler):
    def emit(self, record):
        log_entry = self.format(record)
        print(log_entry)  # Usa print() para exibir o log formatado

formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler = PrintLikeHandler(sys.stdout)
handler.setFormatter(formatter)

# Configurar o nível de log
logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)
# Habilitar o log detalhado para requests (via urllib3)
logging.getLogger("urllib3").setLevel(logging.ERROR)
# Desabilitar warning do TLS
urllib3.disable_warnings()

def requestSefaz(entity_id: str, uf: str, service: str, values: dict):
    try:
        configs = utils.config(uf)
        srv = utils.get_service(service)

        instance = srv.__call__(entity_id, configs, values)

        if not instance.pre_request():   
            instance.error()
            return

        if not instance.request():
            instance.error()
            return
        
        if not instance.post_request():
            instance.error()
            return
    except Exception as e:
        tb = traceback.extract_tb(e.__traceback__)[-1]
        logging.error(f'{str(e)} in {tb.filename}, line: {tb.lineno}')

def lambda_handler(event, context):
    for record in event["Records"]:
        data = json.loads(record["body"])
        print(f"Mensagem recebida: {data}")
        entity = data['entity']
        user = data['username']
        uf = data['uf']
        service = data['service']
        values = data['values']
        env = os.getenv('env', 'prd')
        values['user'] = user
        requestSefaz(entity, f'{env}.{uf}', service, values)

    return {"statusCode": 200, "body": "Mensagens processadas com sucesso"}

if __name__ == "__main__":
    env = os.getenv('env', None)
    if env:
        exit
    os.environ['env'] = 'prd'
    os.environ['s3_name'] = 'matrix-notas'
    os.environ['s3_region'] = 'sa-east-1'
    os.environ['secret_db'] = 'matrix/db/hml'
    os.environ['secret_region'] = 'sa-east-1'
    # Exemplo de uso
    event = {
        "Records": [
            {
                "body": json.dumps( 
                    {
                        "entity": "cd275942-b9d9-4fae-b257-a177d1430754",
                        "username": "bruno.bacs",
                        "uf": "MG",
                        #"service": "nfeDistribuicaoDFeSoap",
                        #"service": "cteDistribuicaoDFeSoap",
                        #"service": "mdfeDistribuicaoDFeSoap",
                        "service": "nfseDFeContribuinte",
                        "values": {
                            "document": "64239601000134",
                            "document_type": "CNPJ",
                            "nsu_nfe": "000000000000000",
                            "nsu_cte": "000000000000000",
                            "nsu_mdfe": "000000000000000",
                            "nsu_nfse": "0"
                        }
                    }
                )
            }
        ]
    }
    lambda_handler(event, None)

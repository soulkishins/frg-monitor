import logging
import traceback
import sefaz_utils as utils
import tempfile
import os

class BaseService:
    def __init__(self, service_name: str, entity_id: str, configs: dict, values: dict):
        self.service_name = service_name
        self.entity_id = entity_id
        self.configs = configs
        self.values = values
        self.error_detail = None
        self.do_request = True
        
        logging.log(logging.INFO, f'BaseService {self.service_name} initialized')

    def get_url(self) -> str:
        return self.configs['urls'][self.service_name]

    def get_header(self) -> dict:
        return {}

    def get_body(self) -> str:
        # Body da Requisição
        return utils.get_service_input(self.service_name)

    def pre_request(self) -> bool:
        try:
            result = self._pre()
            logging.log(logging.INFO, f'Pre-request {self.service_name} with result {result}')
            return result
        except Exception as e:
            tb = traceback.extract_tb(e.__traceback__)[-1]
            self.error_detail = f'{str(e)} in {tb.filename}, line: {tb.lineno}'
            return False
    
    def _pre(self) -> bool:
        return True
    
    def request(self) -> bool:
        try:
            while self.do_request:
                # Endpoint do serviço da SEFAZ
                url = self.get_url()
                # Cabeçalhos da requisição
                headers = self.get_header()
                # Corpo da requisição
                body = self.get_body()
                # Enviar a requisição e Processar a resposta
                result = self._request(url, headers, body)            
            logging.log(logging.INFO, f'Request {self.service_name} with result {result}')
            return result
        except Exception as e:
            tb = traceback.extract_tb(e.__traceback__)[-1]
            self.error_detail = f'{str(e)} in {tb.filename}, line: {tb.lineno}'
            return False
    
    def _request(self, url: str, headers: dict, body: str) -> bool:
        return True
    
    def post_request(self) -> bool:
        try:
            result = self._post()
            logging.log(logging.INFO, f'Post-request {self.service_name} with result {result}')
            return result
        except Exception as e:
            tb = traceback.extract_tb(e.__traceback__)[-1]
            self.error_detail = f'{str(e)} in {tb.filename}, line: {tb.lineno}'
            return False
    
    def _post(self) -> bool:
        return True
    
    def error(self) -> None:
        logging.log(logging.ERROR, f'Error {self.error_detail} in {self.service_name} SEFAZ request')
    
    def get_output_dir(self) -> str:
        base_path = os.path.join(tempfile.gettempdir(), f"output_files/{self.entity_id}/{self.service_name}")
        os.makedirs(base_path, exist_ok=True)
        return base_path


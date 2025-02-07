import json
import os
import base64
import zlib
import logging
import traceback
import sefaz_utils as utils
import uuid
from services.base_service import BaseService
from db.db import DB, set_current_user
from db.models import EntityAttr, Invoice, InvoiceAttr, InvoiceDocs
from concurrent.futures import ThreadPoolExecutor, as_completed

class SefazService(BaseService):
    def __init__(self, entity_id: str, configs: dict, values: dict):
        super().__init__('nfseDFeContribuinte', entity_id, configs, values)
        self.saved_files = {}

    def get_url(self) -> str:
        return super().get_url().replace("{NSU}", str(self.values['nsu']))
    
    def get_body(self) -> str:
        return None
    
    def _pre(self):
        values = self.values
        
        if 'document' not in values:
            return False

        values['cnpj'] = values['document']
        values['nsu'] = int(values['nsu_nfse']) if 'nsu_nfse' in values else 0
        return True

    def _request(self, url: str, headers: dict, body: str):
        # Enviar a requisição
        response_json = utils.request_get(self.entity_id, url, headers)
        # Processar a resposta
        self.process_response(response_json['body'])
        # Retornar True
        return self.values['status'] == 'DOCUMENTOS_LOCALIZADOS' or self.values['status'] == 'NENHUM_DOCUMENTO_LOCALIZADO'

    def process_response(self, body: str):
        logging.info(f'Processar Retorno: {body}')

        try:
            # Parse JSON string to dictionary
            data = json.loads(body)

            status = data.get('StatusProcessamento', 'ERROR')
            self.values['status'] = status

            if status != 'DOCUMENTOS_LOCALIZADOS':
                self.do_request = False
                return False

            # Files elements
            files = data.get('LoteDFe', [])

            # Directory to save files
            output_dir = self.get_output_dir()

            for doczip in files:
                # Extract attributes and content
                nsu = int(doczip.get("NSU"))
                invoice_number = doczip.get("ChaveAcesso")
                schema = doczip.get("TipoDocumento").lower()
                base64_data = doczip.get("ArquivoXml")

                # Decode the base64 data
                compressed_data = base64.b64decode(base64_data)
                
                # Decompress the data
                decompressed_data = zlib.decompress(compressed_data, zlib.MAX_WBITS | 16)
            
                # Convert xml to dict
                file_data = utils.xml_to_dict(decompressed_data)
                file_data['nsu'] = nsu
                file_data['schema'] = schema
                file_data['chNFSe'] = invoice_number

                # Define the file name and save
                filename = self.__get_filename_by_schema(file_data)
                file_path = os.path.join(output_dir, filename)

                file_data['filename'] = filename
                file_data['file_path'] = file_path

                # Save the file
                with open(file_path, "wb") as file:
                    file.write(decompressed_data)

                doctype = schema
                if not invoice_number in self.saved_files:
                    self.saved_files[invoice_number] = {}
                self.saved_files[invoice_number][doctype] = file_data

            self.values['nsu'] = nsu
            
            return True
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON string: {str(e)} in {body}")
        except Exception as e:
            raise RuntimeError(f"Error processing file: {str(e)} in {body}")

        return False

    def _post(self) -> bool:
        error = []
        with ThreadPoolExecutor(max_workers=20) as executor:
            saved_invoice = {executor.submit(self.__save_invoice, invoice_number, files): invoice_number for invoice_number, files in self.saved_files.items()}

            for future in as_completed(saved_invoice):
                result = future.result()
                if not result['status']:
                    error.append(result)

        if len(error) > 0:
            print('Error ao processar as notas', error)

        db = DB()
        set_current_user(self.values['user'])
        with db:
            session = db.session
            nsu = session.query(EntityAttr).filter_by(id_entity = self.entity_id, id_attr = 'nsu_nfse').first()
            if nsu:
                nsu.st_value = self.values['nsu']
            else:
                session.add(EntityAttr(id_entity = self.entity_id, id_attr = 'nsu_nfse', st_value = self.values['nsu']))
            session.commit()
        return True

    def __save_invoice(self, invoice_number, files) -> dict:
        try:
            logging.info(f'Processando Nota {invoice_number}')
            db = DB()
            set_current_user(self.values['user'])

            with db:
                session = db.session

                nfse = files.get('nfse', None)

                # Localizar a Nota ja recepcionada
                invoice = session.query(Invoice).filter_by(id_entity=self.entity_id, st_invoice_code=invoice_number, st_invoice_type='nfse').first()
                logging.info(f'Retorno da busca da Nota {invoice_number}: {invoice}')
                if not invoice and nfse:
                    utils.carregar_arquivo(f'sefaz/{self.entity_id}/nfse/{invoice_number}/{nfse["filename"]}', nfse["file_path"])
                    invoice = self.__invoice_by_nfse(nfse, self.entity_id)
                    logging.info(f'Salvando a Nota {invoice_number}: {invoice}')
                    session.add(invoice)
                    
                # Salvar evento de nova Nota
                for evento, evento_data in files.items():
                    if evento.startswith('evento'):
                        utils.carregar_arquivo(f'sefaz/{self.entity_id}/nfse/{invoice_number}/{evento_data["filename"]}', evento_data["file_path"])
                        evento = self.__invoice_docs_by_evento(evento_data, self.entity_id, invoice.id if invoice else None)
                        session.add(evento)

                logging.info(f'Commitando Nota {invoice_number}')

                session.commit()
                
            return {"status": True, "invoice": invoice_number}
        except Exception as e:
            tb = traceback.extract_tb(e.__traceback__)[-1]
            error_detail = f'{str(e)} in {tb.filename}, line: {tb.lineno}'
            logging.error(f'Erro ao processar nota {invoice_number}: {error_detail}')
            return {"status": False, "invoice": invoice_number, "error": error_detail}

    # private methods
    def __get_filename_by_schema(self, file_data: dict) -> str:
        if file_data['schema'] == 'nfse':
            return f"{file_data['chNFSe']}_nfse.xml"
        # amazonq-ignore-next-line
        raise Exception(f"Error unknown schema: {file_data['schema']}")

    def __invoice_by_nfse(self, data: dict, entity: uuid) -> Invoice:
        def getDocument(docTag: dict):
            if not docTag:
                return None
            if 'CNPJ' in docTag:
                return docTag['CNPJ']
            if 'CPF' in docTag:
                return docTag['CPF']
            return 'N/I'

        return Invoice(
            id = uuid.uuid4(),
            id_entity = entity,
            st_invoice_code = data['chNFSe'],
            st_invoice_type = 'nfse',
            st_payer = getDocument(data['infNFSe']['DPS']['infDPS']['toma']),
            st_issuer = getDocument(data['infNFSe']['emit']),
            st_carrier = None,
            st_status = data['infNFSe']['cStat'],
            st_reason = None,
            dt_invoice = data['infNFSe']['dhProc']
        )

    def __invoice_docs_by_evento(self, data: dict, entity: uuid, invoice: uuid) -> InvoiceDocs:
        return InvoiceDocs(
            id = uuid.uuid4(),
            id_entity = entity,
            id_invoice = invoice,
            st_invoice_code = data['chNFSe'],
            st_invoice_type = 'nfse',
            st_doctype = data['schema'],
            st_filename = data['filename']
        )

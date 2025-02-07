import os
import base64
import zlib
import logging
import traceback
import xml.etree.ElementTree as ET
import sefaz_utils as utils
import uuid
from services.base_service import BaseService
from db.db import DB, set_current_user
from db.models import EntityAttr, Invoice, InvoiceAttr, InvoiceDocs
from concurrent.futures import ThreadPoolExecutor, as_completed

class SefazService(BaseService):
    def __init__(self, entity_id: str, configs: dict, values: dict):
        super().__init__('cteDistribuicaoDFeSoap', entity_id, configs, values)
        self.saved_files = {}

    def get_header(self) -> dict:
        return {
            "Content-Type": "text/xml;charset=UTF-8",
            "SOAPAction": "http://www.portalfiscal.inf.br/cte/wsdl/CTeDistribuicaoDFe/cteDistDFeInteresse"
        }

    def get_body(self) -> str:
        template = super().get_body()
        xml = template.replace("$tpAmb", self.configs['parameters']['tpAmb'])
        xml = xml.replace("$cUFAutor", self.configs['parameters']['cUF'])
        xml = xml.replace("$CNPJ", self.values['cnpj'])
        xml = xml.replace("$ultNSU", self.values['ultNSU'])
        return xml
    
    def _pre(self):
        values = self.values
        
        if 'document' not in values:
            return False

        values['cnpj'] = values['document']
        values['ultNSU'] = values['nsu_cte'] if 'nsu_cte' in values else '000000000000000'
        return True

    def _request(self, url: str, headers: dict, body: str):
        # Enviar a requisição
        response_soap = utils.request_soap(self.entity_id, url, headers, body)
        # Processar a resposta
        return self.process_response(response_soap['body'])

    def continue_request(self) -> bool:
        if 'ultNSU' not in self.values:
            return False
        if 'cnpj' not in self.values:
            return False
        if 'maxNSU' in self.values and int(self.values['ultNSU']) >= int(self.values['maxNSU']):
            return False
        return True

    def validate_status(self) -> bool:
        if self.values['status'] != '138':
            return False
        return True

    def process_response(self, body: str):
        logging.info(f'Processar Retorno: {body}')

        # Parse the XML content
        namespace = {'cte': 'http://www.portalfiscal.inf.br/cte'}
        # amazonq-ignore-next-line
        root = ET.fromstring(body)
        
        status = root.find('.//cte:cStat', namespace).text
        motivo = root.find('.//cte:xMotivo', namespace).text
        ultNSU = root.find('.//cte:ultNSU', namespace).text
        maxNSU = root.find('.//cte:maxNSU', namespace).text

        self.values['status'] = status
        self.values['motivo'] = motivo
        self.values['maxNSU'] = maxNSU
        
        if not self.validate_status():
            self.do_request = False
            return False
        
        self.values['ultNSU'] = ultNSU
        self.do_request = self.continue_request()

        # Find all <docZip> elements
        doczip_elements = root.findall('.//cte:docZip', namespace)

        # Directory to save files
        output_dir = self.get_output_dir()

        for doczip in doczip_elements:
            # Extract attributes and content
            nsu = doczip.get("NSU")
            schema = doczip.get("schema")
            base64_data = doczip.text

            # Decode the base64 data
            compressed_data = base64.b64decode(base64_data)
            
            # Decompress the data
            decompressed_data = zlib.decompress(compressed_data, zlib.MAX_WBITS | 16)

            # Convert xml to dict
            file_data = utils.xml_to_dict(decompressed_data)
            file_data['nsu'] = nsu
            file_data['schema'] = schema

            # Define the file name and save
            filename = self.__get_filename_by_schema(file_data)
            file_path = os.path.join(output_dir, filename)

            file_data['filename'] = filename
            file_data['file_path'] = file_path

            # Save the file
            with open(file_path, "wb") as file:
                file.write(decompressed_data)

            invoice_number = self.__get_invoice_number_by_schema(file_data)
            doctype = self.__get_doctype_by_schema(file_data)

            if not invoice_number in self.saved_files:
                self.saved_files[invoice_number] = {}
            self.saved_files[invoice_number][doctype] = file_data

        return True
    
    def _post(self) -> bool:
        error = []
        with ThreadPoolExecutor(max_workers=20) as executor:
            saved_invoice = {executor.submit(self.__save_invoice, invoice_number, files): invoice_number for invoice_number, files in self.saved_files.items()}

            for future in as_completed(saved_invoice):
                result = future.result()
                if not result['status']:
                    error.append(result)

        self.saved_files = None

        if len(error) > 0:
            print('Error ao processar as notas', error)

        db = DB()
        set_current_user(self.values['user'])
        with db:
            session = db.session
            nsu = session.query(EntityAttr).filter_by(id_entity = self.entity_id, id_attr = 'nsu_cte').first()
            if nsu:
                nsu.st_value = self.values['ultNSU']
            else:
                session.add(EntityAttr(id_entity = self.entity_id, id_attr = 'nsu_cte', st_value = self.values['ultNSU']))    
            session.commit()
        return True

    def __save_invoice(self, invoice_number, files) -> dict:
        try:
            logging.info(f'Processando Nota {invoice_number}')
            
            db = DB()
            set_current_user(self.values['user'])

            with db:
                session = db.session
                cte = files.get('cte', None)

                # Localizar a Nota ja recepcionada
                invoice = session.query(Invoice).filter_by(id_entity=self.entity_id, st_invoice_code=invoice_number, st_invoice_type='cte').first()
                logging.info(f'Retorno da busca da Nota {invoice_number}: {invoice}')
                if not invoice and cte:
                    utils.carregar_arquivo(f'sefaz/{self.entity_id}/cte/{invoice_number}/{cte["filename"]}', cte["file_path"])
                    invoice = self.__invoice_by_cte(cte, self.entity_id)
                    logging.info(f'Salvando a Nota {invoice_number}: {invoice}')
                    session.add(invoice)

                # Salvar evento de nova Nota
                for evento, evento_data in files.items():
                    if evento.startswith('evento'):
                        utils.carregar_arquivo(f'sefaz/{self.entity_id}/cte/{invoice_number}/{evento_data["filename"]}', evento_data["file_path"])
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
        if file_data['schema'] == 'procCTe_v4.00.xsd':
            cte_data = file_data['protCTe']['infProt']
            return f"{cte_data['chCTe']}_cte.xml"
        if file_data['schema'] == 'procEventoCTe_v4.00.xsd':
            cte_data = file_data['retEventoCTe']['infEvento']
            return f"{cte_data['chCTe']}_evento_{cte_data['tpEvento']}_{cte_data['nSeqEvento']}.xml"
        # amazonq-ignore-next-line
        raise Exception(f"Error unknown schema: {file_data['schema']}")

    def __get_invoice_number_by_schema(self, file_data: dict) -> str:
        if file_data['schema'] == 'procCTe_v4.00.xsd':
            cte_data = file_data['protCTe']['infProt']
            return cte_data['chCTe']
        if file_data['schema'] == 'procEventoCTe_v4.00.xsd':
            cte_data = file_data['retEventoCTe']['infEvento']
            return cte_data['chCTe']
        # amazonq-ignore-next-line
        raise Exception(f"Error unknown schema: {file_data['schema']}")

    def __get_doctype_by_schema(self, file_data: dict) -> str:
        if file_data['schema'] == 'procCTe_v4.00.xsd':
            return 'cte'
        if file_data['schema'] == 'procEventoCTe_v4.00.xsd':
            cte_data = file_data['retEventoCTe']['infEvento']
            return f'evento_{cte_data['tpEvento']}_{cte_data['nSeqEvento']}'
        # amazonq-ignore-next-line
        raise Exception(f"Error unknown schema: {file_data['schema']}")

    def __invoice_by_cte(self, data: dict, entity: uuid) -> Invoice:
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
            st_invoice_code = data['protCTe']['infProt']['chCTe'],
            st_invoice_type = 'cte',
            st_payer = getDocument(data['CTe']['infCte']['dest']),
            st_issuer = getDocument(data['CTe']['infCte']['rem']),
            st_carrier = getDocument(data['CTe']['infCte']['emit']),
            st_status = data['protCTe']['infProt']['cStat'],
            st_reason = data['protCTe']['infProt']['xMotivo'],
            dt_invoice = data['protCTe']['infProt']['dhRecbto']
        )

    def __invoice_docs_by_evento(self, data: dict, entity: uuid, invoice: uuid) -> InvoiceDocs:
        return InvoiceDocs(
            id = uuid.uuid4(),
            id_entity = entity,
            id_invoice = invoice,
            st_invoice_code = data['retEventoCTe']['infEvento']['chCTe'],
            st_invoice_type = 'cte',
            st_doctype = self.__get_doctype_by_schema(data),
            st_filename = data['filename']
        )

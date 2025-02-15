from operations.crud_base import Crud
from db.models import MatrixUserEntity, Entity, Invoice, InvoiceDocs
from sqlalchemy.orm import contains_eager

class MatrixInvoiceCrud(Crud):
    def get_model(self) -> Invoice:
        return Invoice
    
    def read_full(self, indexes, filters, body) -> Invoice:
        records = self._session \
            .query(Invoice) \
            .options(contains_eager(Invoice.entity)) \
            .options(contains_eager(Invoice.attributes)) \
            .outerjoin(MatrixUserEntity, Invoice.id_entity == MatrixUserEntity.id_entity) \
            .outerjoin(Invoice.entity) \
            .outerjoin(Invoice.attributes) \
            .filter(*self.filter_by_pk(indexes)).all()

        if len(records) > 0:
            return (200, records[0])
        return (404, None)

    def get_options(self) -> list:
        return (contains_eager(Invoice.entity),)

    def get_joins(self, indexes, filters):
        return (
            (MatrixUserEntity, Invoice.id_entity == MatrixUserEntity.id_entity),
            Invoice.entity
        )

    def filter_by_pk(self, indexes) -> list:
        return (
            MatrixUserEntity.id_account == indexes['account'],
            MatrixUserEntity.id_user == indexes['id_user'],
            Invoice.id == indexes['invoice']
        )

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'account' in indexes:
            where.append(MatrixUserEntity.id_account == indexes['account'])
        if 'user' in indexes:
            where.append(MatrixUserEntity.id_user == indexes['user'])

        if 'id_entity' in indexes:
            where.append(Invoice.id_entity == filters['id_entity'])
        if 'st_name' in filters:
            where.append(Entity.st_name.ilike(f"%{filters['st_name']}%"))
        if 'document' in filters:
            where.append(Entity.st_document == filters['document'])
            where.append(Entity.st_document_type == filters['document_type'])
        if 'st_email' in filters:
            where.append(Entity.st_email.ilike(f"%{filters['st_email']}%"))
        if 'st_phone' in filters:
            where.append(Entity.st_phone.ilike(f"%{filters['st_phone']}%"))
        if 'st_status' in filters:
            where.append(Entity.st_status == filters['st_status'])

        if 'st_invoice_code' in filters:
            where.append(Invoice.st_invoice_code.ilike(f"%{filters['st_invoice_code']}%"))
            where.append(Invoice.st_invoice_type == filters['st_invoice_type'])
        if 'st_payer' in filters:
            where.append(Invoice.st_payer.ilike(f"%{filters['st_payer']}%"))
        if 'st_issuer' in filters:
            where.append(Invoice.st_issuer.ilike(f"%{filters['st_issuer']}%"))
        if 'st_carrier' in filters:
            where.append(Invoice.st_carrier.ilike(f"%{filters['st_carrier']}%"))
        if 'st_status' in filters:
            where.append(Invoice.st_status == filters['st_status'])
        if 'st_reason' in filters:
            where.append(Invoice.st_reason == filters['st_reason'])
        if 'dt_invoice' in filters:
            dt_invoice = self.get_range_datetime(filters['dt_invoice'])
            where.append(Invoice.dt_invoice >= dt_invoice[0])
            where.append(Invoice.dt_invoice <= dt_invoice[1])
        
        return where + super().filter_by(indexes, filters)
    
    def json_transform(self, method):
        if method == 'read_full':
            return 'to_full_dict'
        return None
    
    def download(self, indexes, filters, body):
        print('Iniciando download da nota', indexes)
        invoice = self.read(indexes)
        if not invoice:
            return None

        print('Buscando arquivos da nota')
        docs = self._session \
            .query(InvoiceDocs) \
            .filter(InvoiceDocs.id_invoice == invoice.id).all()
        
        print('Encontrados', len(docs), 'arquivos')
        doc_zip = [doc for doc in docs if doc.st_doctype == 'zip']

        if not doc_zip or len(doc_zip) == 0:
            raise Exception('Nenhum arquivo zip encontrado')

        import crud_s3_utils as s3

        print('Baixando arquivo zip')
        doc_zip = doc_zip[0]
        doc_zip_path = s3.get_tmp_file()
        s3_prefix = f'sefaz/{invoice.id_entity}/{invoice.st_invoice_type}/{invoice.dt_invoice.strftime("%Y-%m-%d")}/{invoice.st_invoice_code}/'
        
        print('s3_prefix:', s3_prefix)

        if not s3.baixar_arquivo(f'{s3_prefix}{doc_zip.st_filename}', doc_zip_path):
            raise Exception(f'Erro ao localizar arquivo da nota')
        
        filetype = filters['filetype'] if 'filetype' in filters else 'xml'

        filename_to_download = f'{invoice.st_invoice_code}_{invoice.st_invoice_type}.{filetype}'

        print('filename_to_download:', filename_to_download)
        if filetype == 'zip':
            return (200, build_download_file(filename_to_download, file_to_download = doc_zip_path))

        import zipfile

        if 'filename' in filters:
            filename_to_download = f'{filters['filename']}'

        print('filename_to_download:', filename_to_download)
        print('localizando arquivo no zip')
        with zipfile.ZipFile(doc_zip_path, 'r') as zipf:
            with zipf.open(filename_to_download) as file:
                content = file.read()

        print('retornando arquivo')
        return (200, build_download_file(filename_to_download, file_content = content))

def build_download_file(filename_to_download, *, file_to_download = None, file_content = None):
    import base64

    if file_to_download:
        with open(file_to_download, 'rb') as file:
            file_content = file.read()

    # convert to base64
    file_content = base64.b64encode(file_content).decode('utf-8')
    return {"filename": filename_to_download, "content": file_content}

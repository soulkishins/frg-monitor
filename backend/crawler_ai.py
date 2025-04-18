from ai.bedrock import extract_products
from db.db import DB, set_current_user
from db.models import ClientBrandProduct, ClientBrand, Subcategory, Advertisement, AdvertisementProduct, AdvertisementHistory
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
import json
import traceback

ADVERTISEMENT_STATUS_NEW = 'NEW'
ADVERTISEMENT_STATUS_ERROR = 'ERROR'
ADVERTISEMENT_STATUS_REPORT = 'REPORT'
ADVERTISEMENT_STATUS_REPORTED = 'REPORTED'
ADVERTISEMENT_STATUS_MANUAL = 'MANUAL'
ADVERTISEMENT_STATUS_REVIEWED = 'REVIEWED'
ADVERTISEMENT_STATUS_INVALIDATE = 'INVALIDATE'

def find_advertisement(session: Session, advertisement: str) -> Advertisement | None:
    advertisement = session.query(Advertisement).filter(Advertisement.id_advertisement == advertisement).all()
    
    if len(advertisement) == 0:
        return None

    return advertisement[0]

def find_products(session: Session, advertisement: Advertisement) -> list[ClientBrandProduct]:    
    products = session.query(
        ClientBrandProduct
    ).options(
        joinedload(ClientBrandProduct.brand).joinedload(ClientBrand.client),
        joinedload(ClientBrandProduct.subcategory).joinedload(Subcategory.category)
    ).filter(
        ClientBrandProduct.id_brand == advertisement.id_brand
    ).all()

    return products

def convert_product(product: ClientBrandProduct) -> dict:
    varieties = json.loads(product.st_variety)
    variety_list = [{
        "id_variety": variety['seq'],
        "variety_name": variety['variety'] if variety['variety'] != '.' else '*',
        "price": variety['price']
    } for variety in varieties if variety['status'] == 'active']
    return {
        "id_product": product.id_product,
        "category_name": product.subcategory.category.st_category,
        "subcategory_name": product.subcategory.st_subcategory,
        "company_name": product.brand.client.st_name,
        "brand_name": product.brand.st_brand,
        "product_name": product.st_product,
        "variety": variety_list,
    }

def lookup_products(session: Session, advertisement: Advertisement) -> list[dict]:
    products = find_products(session, advertisement)
    product_list = [convert_product(product) for product in products]
    #print('Produtos cadastrados:')
    #print(json.dumps(product_list, default=str, indent=4))
    return product_list

def extract_products_by_ai(advertisement: Advertisement, product_list: list[dict]) -> list[dict]:
    advertisement_text = f"Título: {advertisement.st_title}\nDescrição: {advertisement.st_description}"
    advertisement_products = json.loads(extract_products(advertisement_text, product_list))
    #print('Produtos encontrados:')
    #print(json.dumps(advertisement_products, default=str, indent=4))
    advertisement_products_list = []
    for advertisement_product in advertisement_products:
        if advertisement_product['id_variety'] is None or len(advertisement_product['id_variety']) == 0:
            advertisement_product['id_variety'] = ['0']
        for id_variety in advertisement_product['id_variety']:
            advertisement_products_list.append({
                "id_product": advertisement_product['id_product'],
                "id_variety": id_variety,
                "st_brand_name": advertisement_product['st_brand_name'],
                "st_product_name": advertisement_product['st_product_name'],
                "st_variety_name": advertisement_product['st_variety_name'],
                "nr_quantity": advertisement_product['nr_quantity'],
                'reconciled': False
            })
    #print('Produtos encontrados Formatados:')
    #print(json.dumps(advertisement_products_list, default=str, indent=4))
    return advertisement_products_list

def reconcile_products_from_advertisement(advertisement: Advertisement, products_extracted: list[dict], product_list: list[dict]) -> list[dict]:
    products_included = []
    for product in advertisement.products:
        for product_extracted in products_extracted:
            if str(product.id_product) == str(product_extracted['id_product']) and str(product.st_varity_seq) == str(product_extracted['id_variety']):
                product_extracted['reconciled'] = True
                products_included.append({
                    'included': product,
                    'extracted': product_extracted,
                    'price': find_price(product.id_product, product.st_varity_seq, product_list),
                    'status': 'AR'
                })
    return products_included

def ai_included_products(advertisement: Advertisement, products_extracted: list[dict], product_list: list[dict]) -> list[dict]:
    products_included = []
    for product_extracted in products_extracted:
        if not product_extracted['reconciled'] and product_extracted['id_product'] and product_extracted['id_variety']:
            products_included.append({
                'included': AdvertisementProduct(
                    id_advertisement=advertisement.id_advertisement,
                    id_product=product_extracted['id_product'],
                    st_varity_seq=product_extracted['id_variety'],
                    st_varity_name=product_extracted['st_variety_name'],
                    nr_quantity=product_extracted['nr_quantity'],
                    en_status='AI'
                ),
                'extracted': product_extracted,
                'price': find_price(product_extracted['id_product'], product_extracted['id_variety'], product_list),
                'status': 'AI'
            })
    return products_included

def extract_products_from_advertisement(advertisement_id: str):
    db = DB()
    set_current_user('crawler_ai')

    with db:
        session = db.session

        advertisement = find_advertisement(session, advertisement_id)
        if advertisement is None:
            return

        try:
            product_list = lookup_products(session, advertisement)
            products_extracted = extract_products_by_ai(advertisement, product_list)
            products_included = reconcile_products_from_advertisement(advertisement, products_extracted, product_list)
            products_included += ai_included_products(advertisement, products_extracted, product_list)

            print('Produtos Incluídos:')
            print(json.dumps(products_included, default=str, indent=4))

            st_status = ADVERTISEMENT_STATUS_NEW
            for product_extracted in products_extracted:
                if not product_extracted['reconciled']:
                    st_status = ADVERTISEMENT_STATUS_MANUAL
                    break
        
            if len(products_included) == 0:
                st_status = ADVERTISEMENT_STATUS_INVALIDATE
            
            if st_status == ADVERTISEMENT_STATUS_NEW:
                price = 0
                for product_included in products_included:
                    price += product_included['price'] * product_included['extracted']['nr_quantity']

                percentage = (advertisement.db_price / price) * 100
                if percentage <= 70:
                    st_status = ADVERTISEMENT_STATUS_MANUAL
                elif percentage < 100:
                    st_status = ADVERTISEMENT_STATUS_REPORT

            for product_included in products_included:
                if product_included['status'] == 'AI':
                    session.add(product_included['included'])
                else:
                    product_included['included'].en_status = product_included['status']
                    product_included['included'].nr_quantity = product_included['extracted']['nr_quantity']
            advertisement.st_status = st_status
            advertisement.bl_reconcile = True

            advertisementHistory = AdvertisementHistory(
                id_advertisement=advertisement.id_advertisement,
                dt_history=datetime.now(),
                st_status=st_status,
                st_action='CRAWLER_RECONCILE',
                st_history=json.dumps(products_extracted, default=str)
            )
            session.add(advertisementHistory)

            print(f'Status do anúncio: {st_status}')
            session.commit()
        except Exception as e:
            print(f'Erro ao processar anúncio {advertisement_id}: {e}')
            session.rollback()
            advertisement.st_status = ADVERTISEMENT_STATUS_MANUAL
            advertisement.bl_reconcile = True
            advertisementHistory = AdvertisementHistory(
                id_advertisement=advertisement.id_advertisement,
                dt_history=datetime.now(),
                st_status=ADVERTISEMENT_STATUS_MANUAL,
                st_action='CRAWLER_RECONCILE',
                st_history=json.dumps({"error": str(e)}, default=str)
            )
            session.add(advertisementHistory)
            session.commit()

def find_price(id_product: str, st_varity_seq: str, product_list: list[dict]) -> float:
    for product in product_list:
        if str(product['id_product']) == str(id_product):
            for variety in product['variety']:
                if str(variety['id_variety']) == str(st_varity_seq):
                    return variety['price']
    return 0.0

def lambda_handler(event, context):
    try:
        for record in event["Records"]:
            data = json.loads(record["body"])
            print(f"Mensagem recebida: {data}")
            for advertisement in data:
                extract_products_from_advertisement(advertisement)

        return {"statusCode": 200, "body": "Mensagens processadas com sucesso"}
    except Exception as e:
        error_line = traceback.extract_tb(e.__traceback__)[-1].lineno
        return {"statusCode": 500, "body": json.dumps({"error": f"Erro na linha {error_line}: {str(e)}"})}

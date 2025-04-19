from ai.bedrock import extract_products
from db.db import DB, set_current_user
from db.models import ClientBrandProduct, ClientBrand, Subcategory, Advertisement, AdvertisementProduct, AdvertisementHistory, SchedulerStatistics
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, update
from datetime import datetime
import json
import traceback
import uuid
import os
ADVERTISEMENT_STATUS_NEW = 'NEW'
ADVERTISEMENT_STATUS_ERROR = 'ERROR'
ADVERTISEMENT_STATUS_REPORT = 'REPORT'
ADVERTISEMENT_STATUS_REPORTED = 'REPORTED'
ADVERTISEMENT_STATUS_MANUAL = 'MANUAL'
ADVERTISEMENT_STATUS_REVIEWED = 'REVIEWED'
ADVERTISEMENT_STATUS_INVALIDATE = 'INVALIDATE'

AI_ENABLED = os.getenv('AI_ENABLED', 'false').lower() == 'true'

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
    advertisement_products = extract_products(advertisement_text, product_list)
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
    #print('Produtos vinculados ao anúncio:')
    #print(json.dumps(advertisement.products, default=str, indent=4))
    
    products_included = []
    for product in advertisement.products:
        for product_extracted in products_extracted:
            if str(product.id_product) == str(product_extracted['id_product']) and str(product.st_varity_seq) == str(product_extracted['id_variety']):
                product_extracted['reconciled'] = True
                product.nr_quantity = product_extracted['nr_quantity']
                product.en_status = 'AR'
                products_included.append({
                    'included': product,
                    'extracted': product_extracted,
                    'price': find_price(product.id_product, product.st_varity_seq, product_list),
                    'status': 'AR'
                })
    return products_included

def ai_included_products(session: Session, advertisement: Advertisement, products_extracted: list[dict], product_list: list[dict]) -> list[dict]:
    products_included = []
    for product_extracted in products_extracted:
        if not product_extracted['reconciled'] and product_extracted['id_product'] and product_extracted['id_variety']:
            product_extracted['reconciled'] = True
            product = AdvertisementProduct(
                id_advertisement=advertisement.id_advertisement,
                id_product=uuid.UUID(product_extracted['id_product']),
                st_varity_seq=product_extracted['id_variety'],
                st_varity_name=product_extracted['st_variety_name'],
                nr_quantity=product_extracted['nr_quantity'],
                en_status='AI'
            )
            session.add(product)
            products_included.append({
                'included': product,
                'extracted': product_extracted,
                'price': find_price(product_extracted['id_product'], product_extracted['id_variety'], product_list),
                'status': 'AI'
            })
    return products_included

def find_price(id_product: str, st_varity_seq: str, product_list: list[dict]) -> float:
    for product in product_list:
        if str(product['id_product']) == str(id_product):
            for variety in product['variety']:
                if str(variety['id_variety']) == str(st_varity_seq):
                    return variety['price']
    return 0.0

def extract_products_from_advertisement(session: Session, advertisement: Advertisement):
    try:
        product_list = lookup_products(session, advertisement)
        products_extracted = extract_products_by_ai(advertisement, product_list)
        products_included = reconcile_products_from_advertisement(advertisement, products_extracted, product_list)
        products_included += ai_included_products(session, advertisement, products_extracted, product_list)

        session.flush()
        print('Produtos Incluídos + AI:')
        print(json.dumps(products_included, default=str, indent=4))

        st_status = ADVERTISEMENT_STATUS_REVIEWED
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

        advertisement.st_status = st_status
        advertisement.bl_reconcile = True
        session.flush()

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
        
        return True, st_status
    except Exception as e:
        print(f'Erro ao processar anúncio {advertisement.id_advertisement}: {e}')
        print(traceback.extract_tb(e.__traceback__))
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
        return False, ADVERTISEMENT_STATUS_MANUAL

def check_price_from_advertisement(session: Session, advertisement: Advertisement):
    try:
        product_list = lookup_products(session, advertisement)
        price = 0
        for product in advertisement.products:
            if product.en_status == 'AR' or product.en_status == 'AI' or product.en_status == 'MI' or product.en_status == 'MR':
                price += find_price(product.id_product, product.st_varity_seq, product_list) * product.nr_quantity
                
        print(f'Preço do anúncio {advertisement.id_advertisement}: {price} | {advertisement.db_price}')

        st_status = advertisement.st_status
        percentage = (advertisement.db_price / price) * 100
        if percentage <= 70:
            st_status = ADVERTISEMENT_STATUS_MANUAL
        elif percentage < 100:
            st_status = ADVERTISEMENT_STATUS_REPORT

        if advertisement.st_status != st_status:
            advertisement.st_status = st_status
            session.flush()

            advertisementHistory = AdvertisementHistory(
                id_advertisement=advertisement.id_advertisement,
                dt_history=datetime.now(),
                st_status=st_status,
                st_action='CRAWLER_RECONCILE',
                st_history=json.dumps(advertisement.products, default=str)
            )
            session.add(advertisementHistory)

            print(f'Status do anúncio: {st_status}')
            session.commit()
        return True, st_status
    except Exception as e:
        print(f'Erro ao reprocessar preço do anúncio {advertisement.id_advertisement}: {e}')
        print(traceback.extract_tb(e.__traceback__))
        return False, ADVERTISEMENT_STATUS_ERROR

def process_advertisements(data: dict):
    db = DB()
    set_current_user('crawler_ai')

    count = len(data['advertisements'])
    success = 0
    error = 0
    reported = 0
    manual_revision = 0
    invalidate = 0
    print(f'Total de anúncios a processar: {count}')
    while len(data['advertisements']) > 0:
        advertisement_id = data['advertisements'].pop(0)
        try:
            with db:
                session = db.session
                advertisement = find_advertisement(session, advertisement_id)
                if advertisement is None:
                    error += 1
                    continue
                if advertisement.st_status == ADVERTISEMENT_STATUS_INVALIDATE:
                    invalidate += 1
                    continue
                if advertisement.st_status == ADVERTISEMENT_STATUS_ERROR:
                    error += 1
                    continue

                result = True
                st_status = None
                if not advertisement.bl_reconcile:
                    if AI_ENABLED:
                        result, st_status = extract_products_from_advertisement(session, advertisement)
                    else:
                        count -= 1
                        continue
                else:
                    result, st_status = check_price_from_advertisement(session, advertisement)
                success += 1 if result else 0
                error += 0 if result else 1
                if st_status == ADVERTISEMENT_STATUS_REPORT:
                    reported += 1
                elif st_status == ADVERTISEMENT_STATUS_MANUAL:
                    manual_revision += 1
                elif st_status == ADVERTISEMENT_STATUS_INVALIDATE:
                    invalidate += 1
        except Exception as e:
            print(f'Erro ao processar anúncio {advertisement_id}: {e}')
            print(traceback.extract_tb(e.__traceback__))
            error += 1

    print(f'Total de anúncios processados: {count}')
    print(f'Total de anúncios processados com sucesso: {success}')
    print(f'Total de anúncios processados com erro: {error}')
    print(f'Total de anúncios restantes: {len(data["advertisements"])}')

    with db:
        session = db.session
        stmt = (
            update(SchedulerStatistics)
            .where(SchedulerStatistics.id_scheduler == data['scheduler_id'], SchedulerStatistics.dt_created == data['scheduler_date'])
            .values(
                nr_reconcile=SchedulerStatistics.nr_reconcile + count,
                nr_reported=SchedulerStatistics.nr_reported + reported,
                nr_manual_revision=SchedulerStatistics.nr_manual_revision + manual_revision,
                nr_invalidate=SchedulerStatistics.nr_invalidate + invalidate
            )
        )
        session.execute(stmt)
        session.commit()

def lambda_handler(event, context):
    try:
        for record in event["Records"]:
            data = json.loads(record["body"])
            print(f"Mensagem recebida: {data}")
            process_advertisements(data)
        return {"statusCode": 200, "body": "Mensagens processadas com sucesso"}
    except Exception as e:
        error_line = traceback.extract_tb(e.__traceback__)[-1].lineno
        return {"statusCode": 500, "body": json.dumps({"error": f"Erro na linha {error_line}: {str(e)}"})}

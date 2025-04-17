from ai.bedrock import extract_products
from db.db import DB, set_current_user
from db.models import ClientBrandProduct, ClientBrand, Subcategory, Advertisement
import json
import traceback
from sqlalchemy.orm import Session, joinedload

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
    return {
        "id_product": product.id_product,
        "category_name": product.subcategory.category.st_category,
        "subcategory_name": product.subcategory.st_subcategory,
        "company_name": product.brand.client.st_name,
        "brand_name": product.brand.st_brand,
        "product_name": product.st_product,
        "variety": json.loads(product.st_variety),
    }

def product_view(product: dict, variety: dict) -> dict:
    return {
        "id_product": product['id_product'],
        "category_name": product['category_name'],
        "subcategory_name": product['subcategory_name'],
        "company_name": product['company_name'],
        "brand_name": product['brand_name'],
        "product_name": product['product_name'],
        "id_variety": variety['seq'],
        "variety_name": variety['variety'],
    }

def extract_products_from_advertisement(advertisement: str):
    db = DB()
    set_current_user('crawler_ai')

    with db:
        session = db.session

        record = find_advertisement(session, advertisement)
        if record is None:
            return

        products = find_products(session, record)

        product_varities_list = []
        product_list = [convert_product(product) for product in products]
        for product in product_list:
            for variety in product['variety']:
                if variety['status'] == 'active':
                    product_varities_list.append(product_view(product, variety))

        advertisement_text = f"Título: {record.st_title}\nDescrição: {record.st_description}"

        advertisement_products = extract_products(advertisement_text, product_list)

        print(advertisement_products)

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

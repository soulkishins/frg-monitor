import boto3
import json
import os
import time
bedrock_runtime = boto3.client("bedrock-runtime", region_name=os.getenv("bedrock_region"))

def extract_products(advertisement, product_list, retry=False) -> list[dict]:
    try:
        response = bedrock_runtime.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": [{
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Base de dados\n{json.dumps(product_list, default=str)}"
                        },
                        {
                            "type": "text",
                            "text": f"Anúncio\n{advertisement}"
                        },
                        {
                            "type": "text",
                            "text": """extraia os produtos existentes no anúncio, se possível, caso contrário retorne uma lista vazia no formato json e nada além do json.
    Retorne uma lista com os produtos encontrados, com os campos st_brand_name, st_product_name, st_variety_name e nr_quantity, caso o produto exista na base de dados preencha os campos id_product, id_variety referente ao produto localizado.
    Não retorne nada além do json no formato [{"st_product_name": "string", "st_brand_name": "string", "st_variety_name": "string", "nr_quantity": "number", "id_product": "string", "id_variety": "[string, string, ...]"}, ...]."""
                        }
                    ]
                }]
            })
        )

        result = json.loads(response["body"].read().decode())
        # Extrai o texto da resposta
        content = result.get("content", [{}])[0].get("text", "[]")
        
        if content is None or len(content) == 0:
            print(f'Erro ao extrair produtos: {result}')
            return []
        
        if content == 'null' or content[0] != '[':
            print(f'Retorno inválido ao extrair produtos: {content}')
            return []
        
        return json.loads(content)
    except Exception as e:
        if retry:
            print(f'Erro ao extrair produtos: {e}')
            raise e
        time.sleep(60)
        return extract_products(advertisement, product_list, True)

import boto3
import json
import os

bedrock_runtime = boto3.client("bedrock-runtime", region_name=os.getenv("bedrock_region"))

def extract_products(advertisement, product_list) -> list[dict]:
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
                        "text": """extraia os produtos existentes no anúncio.
Retorne uma lista com os produtos encontrados, com os campos st_product_name, st_brand_name, e caso o produto exista na base de dados os campos id_product, id_variety da base de dados referente ao produto localizado.
Não retorne nada além do json."""
                    }
                ]
            }]
        })
    )

    result = json.loads(response["body"].read().decode())
    
    # Extrai o texto da resposta
    content = result.get("content", [{}])[0].get("text", "[]")
    
    return content
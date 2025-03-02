import os
import traceback
import json
import base64
from datetime import datetime, UTC

__DEFAULT_ERRORS = {
    400: "Bad Request - A requisição é inválida.",
    401: "Unauthorized - Autenticação necessária.",
    402: "Payment Required - Pagamento necessário.",
    403: "Forbidden - Acesso negado.",
    404: "Not Found - Recurso não encontrado.",
    405: "Method Not Allowed - Método não permitido.",
    406: "Not Acceptable - Formato de resposta não aceito.",
    407: "Proxy Authentication Required - Autenticação de proxy necessária.",
    408: "Request Timeout - Tempo limite excedido.",
    409: "Conflict - Conflito na requisição.",
    410: "Gone - Recurso removido permanentemente.",
    411: "Length Required - Cabeçalho Content-Length obrigatório.",
    412: "Precondition Failed - Pré-condição falhou.",
    413: "Payload Too Large - Corpo da requisição muito grande.",
    414: "URI Too Long - URL muito longa.",
    415: "Unsupported Media Type - Tipo de mídia não suportado.",
    416: "Range Not Satisfiable - Intervalo inválido para este recurso.",
    417: "Expectation Failed - Cabeçalho Expect não atendido.",
    418: "I'm a teapot - O servidor é um bule de chá. ☕",
    419: "Authentication Timeout - Sessão expirada.",
    421: "Misdirected Request - Requisição direcionada incorretamente.",
    422: "Unprocessable Entity - Erros semânticos na requisição.",
    423: "Locked - O recurso está bloqueado.",
    424: "Failed Dependency - Dependência falhou.",
    425: "Too Early - O servidor não quer processar a requisição ainda.",
    426: "Upgrade Required - Cliente precisa atualizar o protocolo.",
    428: "Precondition Required - Pré-condições são exigidas.",
    429: "Too Many Requests - Muitas requisições em pouco tempo.",
    431: "Request Header Fields Too Large - Cabeçalhos muito grandes.",
    440: "Login Timeout - Sessão de login expirou.",
    444: "No Response - O servidor fechou a conexão sem resposta.",
    449: "Retry With - O cliente deve tentar novamente com modificações.",
    450: "Blocked by Windows Parental Controls - Bloqueado pelo Windows.",
    451: "Unavailable for Legal Reasons - Conteúdo removido por razões legais.",
    460: "Client Closed Request - Cliente fechou a conexão antes da resposta.",
    # Erros 5XX (Servidor)
    500: "Internal Server Error - Erro interno do servidor.",
    501: "Not Implemented - Método não suportado pelo servidor.",
    502: "Bad Gateway - Resposta inválida de outro servidor.",
    503: "Service Unavailable - O servidor está sobrecarregado ou em manutenção.",
    504: "Gateway Timeout - O servidor demorou muito para responder.",
    505: "HTTP Version Not Supported - Versão HTTP não suportada.",
    506: "Variant Also Negotiates - Erro de configuração no servidor.",
    507: "Insufficient Storage - O servidor não tem espaço suficiente.",
    508: "Loop Detected - O servidor detectou um loop infinito.",
    510: "Not Extended - Extensões necessárias para processar a requisição.",
    511: "Network Authentication Required - Autenticação de rede necessária.",
}

def get_crud_service(operation_name, user, session):
    # Matrix - Operações de CRUD vinculadas ao usuario da sessao
    if operation_name == "user":
        from operations.user import UserCrud
        return UserCrud(user, session)
    if operation_name == "category":
        from operations.category import CategoryCrud
        return CategoryCrud(user, session)
    if operation_name == "subcategory":
        from operations.subcategory import SubcategoryCrud
        return SubcategoryCrud(user, session)    
    if operation_name == "client":
        from operations.client import ClientCrud
        return ClientCrud(user, session)
    if operation_name == "client_brand":
        from operations.client_brand import ClientBrandCrud
        return ClientBrandCrud(user, session)
    if operation_name == "client_brand_product":
        from operations.client_brand_product import ClientBrandProductCrud
        return ClientBrandProductCrud(user, session)
    if operation_name == "keyword":
        from operations.keyword import KeywordCrud
        return KeywordCrud(user, session)
    if operation_name == "advertisement":
        from operations.advertisement import AdvertisementCrud
        return AdvertisementCrud(user, session)
    return None

def return_value(status_code, body, *, json_transform = None):
    from db.models import Base
    from operations.crud_base import Page
    if isinstance(body, Base):
        body = to_dict(body, json_transform)
    if isinstance(body, list) and len(body) > 0 and isinstance(body[0], Base):
        body = [to_dict(obj, json_transform) for obj in body]
    if isinstance(body, Page):
        body = body.to_dict()
        body['list'] = [to_dict(obj, json_transform) for obj in body['list']]
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Content-Type": "application/json"
        },
        "body": json.dumps(body, default=str)
    }

def to_dict(body, json_transform = None):
    if json_transform:
        return body.to_custom_dict(json_transform)
    return body.to_dict()
    
def error_object(code, *, message=None, data=None, timestamp=datetime.now(UTC)):
    return {
        "error": code,
        "message": message if message is not None else __DEFAULT_ERRORS[code],
        "data": data,
        "timestamp": timestamp.isoformat()
    }

def handle_exception(message, e):
    print(message, str(e), traceback.format_exc())
    return return_value(500, error_object(500, message=message, data=str(e)))

def decode_jwt(token):
    """ Decodifica um JWT e retorna o payload (segunda parte do token). """
    try:
        _, payload_b64, _ = token.split(".")  # Divide o JWT em header, payload e signature

        # Ajusta padding do Base64
        payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
        
        # Decodifica Base64 e converte JSON para dicionário
        payload_json = base64.b64decode(payload_b64).decode("utf-8")
        payload = json.loads(payload_json)
        
        return payload
    except Exception as e:
        print(f"Erro ao decodificar JWT: {e}")
        return None

def extract_email_from_token(event):
    """ Extrai o e-mail do usuário a partir do token JWT enviado no cabeçalho Authorization. """
    try:
        authorization_header = event["headers"].get("Authorization", "")
        token = authorization_header.replace("Bearer ", "")

        decoded_payload = decode_jwt(token)
        return (decoded_payload.get("email"), decoded_payload.get("sub")) if decoded_payload else None
    except Exception as e:
        print(f"Erro ao extrair email do token: {e}")
        return None

def lambda_handler(event, context):
    from db.db import DB, set_current_user
    from db.models import UserAttr

    try:
        db = DB()
        # Obter o usuario logado pelo token JWT do Cognito no header
        username, sub = extract_email_from_token(event)
        # Setar o usuário na Audit
        set_current_user(username)

        with db:
            session = db.session
            try:
            
                user = session.query(UserAttr).filter(UserAttr.id_attr == 'cognito_sub', UserAttr.st_value == sub).first()
                
                print(f'O usuário {username} localizado {user.id_user}')

                operation_name = event.get('requestContext', {}).get('operationName', 'undefined')
                http_method = event.get("httpMethod")
                query_string_parameters = event.get("queryStringParameters", None)
                query_string_parameters = query_string_parameters if query_string_parameters else {}
                path_parameters = event.get("pathParameters", None)
                path_parameters = path_parameters if path_parameters else {}
                path_parameters['id_user'] = user.id_user
                body = event.get("body", None)
                body = body if body else "{}"
                
                service, method = operation_name.split('.')
                
                print('Executando operação: ', operation_name)

                crud_service = get_crud_service(service, username, session)
                if not crud_service:
                    return return_value(501, error_object(501, message=f"Operation not found: {operation_name}"))

                if http_method == "GET" and method == 'list':
                    model = crud_service.list(path_parameters, query_string_parameters)
                    return return_value(200, model, json_transform=crud_service.json_transform(method)) if model else return_value(404, error_object(404, message='No record founded.'))

                if http_method == "GET" and method == 'read':
                    model = crud_service.read(path_parameters)
                    return return_value(200, model, json_transform=crud_service.json_transform(method)) if model else return_value(404, error_object(404, message='No record founded.'))

                if http_method == "POST" and method == 'create':
                    model = crud_service.create(path_parameters, json.loads(body))
                    session.commit()
                    return return_value(201, model, json_transform=crud_service.json_transform(method))

                if http_method == "PUT" and method == 'update':
                    model = crud_service.update(path_parameters, json.loads(body))
                    session.commit()
                    return return_value(200, model, json_transform=crud_service.json_transform(method))

                if http_method == "DELETE" and method == 'delete':
                    model = crud_service.delete(path_parameters)
                    session.commit()
                    return return_value(200, model, json_transform=crud_service.json_transform(method))

                _method = getattr(crud_service, method, None)
                # Verificar se o método existe e invocá-lo
                if not callable(_method):
                    return return_value(501, error_object(501, message=f"Operation not found: {operation_name}"))
                status, model = _method(path_parameters, query_string_parameters, json.loads(body))
                if __DEFAULT_ERRORS.get(status, None):
                    return return_value(status, error_object(status, data=model))
                return return_value(status, model, json_transform=crud_service.json_transform(method))

            except Exception as e:
                return handle_exception(f'Error ao processar request do CRUD {operation_name}', e)

            finally:
                session.close()
    except Exception as e:
        return handle_exception('Error ao processar request', e)

## PARA TESTE LOCAL ##
if __name__ == "__main__":
    #os.environ['secret_db'] = 'matrix/db/hml'
    os.environ['secret_db'] = 'matrix/db/local'
    os.environ['secret_region'] = 'sa-east-1'

    result = lambda_handler(
        {
            "headers": {"Authorization": "e.eyJzdWIiOiJjMzVjNmE1YS0zMDAxLTcwMjQtNjdkMC1kNWZiYzI4YzE2NmIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnNhLWVhc3QtMS5hbWF6b25hd3MuY29tXC9zYS1lYXN0LTFfM1FBM3NoZDBmIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjpmYWxzZSwiY29nbml0bzp1c2VybmFtZSI6ImMzNWM2YTVhLTMwMDEtNzAyNC02N2QwLWQ1ZmJjMjhjMTY2YiIsIm9yaWdpbl9qdGkiOiJhNjQ0OTI4My1mMzdkLTRlZDMtYmY2YS04NzNlOTBhODhhNDEiLCJhdWQiOiI0dmJmYW82NzFiNHZyamxwbzdsOHU0N2xiYyIsImV2ZW50X2lkIjoiNTQyZjU0YjMtN2U4NC00YTZiLWFkZjgtZmI1N2RhNTQ3NTE0IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3MzkyMzMyOTgsIm5hbWUiOiJCcnVubyBBbnR1bmVzIiwicGhvbmVfbnVtYmVyIjoiKzU1MTE5MzMzMzQ1NjciLCJleHAiOjE3MzkyMzY4OTgsImlhdCI6MTczOTIzMzI5OCwianRpIjoiNGFhM2NkMmYtM2JmMy00YjdiLThmMzctYjVhNDEyNmE2ZmRkIiwiZW1haWwiOiJicnVuby5iYWNzQGdtYWlsLmNvbSJ9.u"},
            "httpMethod": "GET",
            "requestContext": {"operationName": "advertisement.read"},
            "pathParameters": {
                "advertisement": "60fbafb5-cd88-4511-afec-b17881f22d5d"
            },
            "body": "{}"
        },
        None
    )
    print(result)

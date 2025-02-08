import traceback
import os
import json
from db.db import DB, set_current_user
from db.models import Client

def lambda_handler(event, context):
    try:
        db = DB()
        set_current_user(event)

        with db:
            session = db.session

            try:
                http_method = event.get("httpMethod")
                path_parameters = event.get("pathParameters", {})
                body = json.loads(event.get("body", "{}"))
                
                if http_method == "GET":
                    client_id = path_parameters.get("id")
                    if client_id:
                        client = session.query(Client).filter(Client.id == client_id).first()
                        if client:
                            return {"statusCode": 200, "body": json.dumps(client.__dict__, default=str)}
                        return {"statusCode": 404, "body": "Client not found"}

                    clients = session.query(Client).all()
                    return {"statusCode": 200, "body": json.dumps([c.__dict__ for c in clients], default=str)}

                elif http_method == "POST":
                    new_client = Client(**body)
                    session.add(new_client)
                    session.commit()
                    return {"statusCode": 201, "body": json.dumps({"id": str(new_client.id)})}

                elif http_method == "PUT":
                    client_id = path_parameters.get("id")
                    client = session.query(Client).filter(Client.id == client_id).first()
                    if not client:
                        return {"statusCode": 404, "body": "Client not found"}
                    for key, value in body.items():
                        setattr(client, key, value)
                    session.commit()
                    return {"statusCode": 200, "body": "Client updated successfully"}

                elif http_method == "DELETE":
                    client_id = path_parameters.get("id")
                    client = session.query(Client).filter(Client.id == client_id).first()
                    if not client:
                        return {"statusCode": 404, "body": "Client not found"}
                    session.delete(client)
                    session.commit()
                    return {"statusCode": 200, "body": "Client deleted successfully"}

                return {"statusCode": 400, "body": "Invalid request"}

            except Exception as e:
                print_error('Error ao processar request da entidade Cliente', e)
                return {"statusCode": 500, "body": str(e)}

            finally:
                session.close()
    except Exception as e:
        print_error('Error ao processar request da entidade Cliente', e)
        return {"statusCode": 500, "body": str(e)}

def print_error(message, e):
    tb = traceback.extract_tb(e.__traceback__)[-1]
    error_detail = f'{str(e)} in {tb.filename}, line: {tb.lineno}'
    print(f'{message} -> {error_detail}')

if __name__ == "__main__":
    os.environ['secret_db'] = 'matrix/db/hml'
    os.environ['secret_region'] = 'sa-east-1'
    lambda_handler({}, None)

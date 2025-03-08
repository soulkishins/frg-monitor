from operations.crud_base import Crud
from db.models import User, UserAttr
from sqlalchemy.orm import contains_eager
import boto3
import os
from datetime import datetime
import random

user_pool_id = os.getenv('user_pool_id')

class UserCrud(Crud):
    def get_model(self) -> User:
        return User

    def create(self, indexes, data) -> User:
        # Cria o usuário no banco de dados
        record = super().create(indexes, data)
        self._session.commit()
        
        obj = record.to_dict()

        try:
            # Inicializa o cliente do Cognito
            cognito = boto3.client('cognito-idp', region_name='sa-east-1')
            
            # Gera uma senha para o usuário
            password = 'Frg@' + datetime.now().strftime('%Y') + '!' + str(random.randint(1000, 9999))
            obj['st_password'] = password
            
            # Cria o usuário no Cognito
            cognito_response = cognito.admin_create_user(
                UserPoolId=user_pool_id,
                Username=data['st_email'],
                TemporaryPassword=password,
                UserAttributes=self.user_attr_cognito(record),
                MessageAction='SUPPRESS'  # Não envia email automático do Cognito
            )
            
            cognito.admin_set_user_password(
                UserPoolId=user_pool_id,
                Username=data['st_email'],
                Password=password,
                Permanent=True
            )
            
            cognito.admin_enable_user(
                UserPoolId=user_pool_id,
                Username=data['st_email']
            )
            
            # Se o usuário foi criado com sucesso no Cognito, salva o sub como atributo
            if cognito_response['User']['Username']:
                cognito_sub = cognito_response['User']['Username']
                
                # Cria o atributo para armazenar o sub do Cognito
                user_attr = UserAttr(
                    id_user=record.id,
                    id_attr='cognito_sub',
                    st_value=cognito_sub
                )
                self._session.add(user_attr)
                self._session.commit()
        except Exception as e:
            # Se houver erro na criação do usuário no Cognito, faz rollback no banco
            self._session.delete(record)
            self._session.commit()
            raise Exception(f"Erro ao criar usuário no Cognito: {str(e)}")

        return obj

    def update(self, indexes, data) -> User:
        record = super().update(indexes, data)
        
        try:
            # Atualiza os atributos do usuário no Cognito
            if record:
                cognito = boto3.client('cognito-idp', region_name='sa-east-1')
                
                # Busca o sub do usuário
                cognito_sub = next(
                    (attr.st_value for attr in record.attributes if attr.id_attr == 'cognito_sub'),
                    None
                )
                
                if cognito_sub:
                    user_attributes = self.user_attr_cognito(record)
                    
                    if user_attributes:
                        cognito.admin_update_user_attributes(
                            UserPoolId=user_pool_id,
                            Username=cognito_sub,
                            UserAttributes=user_attributes
                        )
        
        except Exception as e:
            # Log do erro, mas não impede a atualização no banco
            print(f"Erro ao atualizar usuário no Cognito: {str(e)}")

        return record

    def delete(self, indexes) -> User:
        record = self.read(indexes)
        if record:
            if record.attributes:
                for attr in record.attributes:
                    self._session.delete(attr)
            self._session.delete(record)

        try:
            # Desativa o usuário no Cognito
            if record:
                cognito = boto3.client('cognito-idp', region_name='sa-east-1')
                
                # Busca o sub do usuário
                cognito_sub = next(
                    (attr.st_value for attr in record.attributes if attr.id_attr == 'cognito_sub'),
                    None
                )
                
                if cognito_sub:
                    cognito.admin_disable_user(
                        UserPoolId=user_pool_id,
                        Username=cognito_sub
                    )
                    cognito.admin_delete_user(
                        UserPoolId=user_pool_id,
                        Username=cognito_sub
                    )
        
        except Exception as e:
            # Log do erro, mas não impede a deleção no banco
            print(f"Erro ao desativar usuário no Cognito: {str(e)}")

        return record
    
    def user_attr_cognito(self, record: User) -> dict:
        user_attributes = []
        if record.st_name:
            user_attributes.append({
                'Name': 'name',
                'Value': record.st_name
            })
        if record.st_email:
            user_attributes.append({
                'Name': 'email',
                'Value': record.st_email
            })
        if record.st_phone:
            user_attributes.append({
                'Name': 'phone_number',
                'Value': record.st_phone
            })
        user_attributes.append({
            'Name': 'email_verified',
            'Value': 'true'
        })
        return user_attributes

    def get_joins(self, indexes, filters) -> list:
        return (User.attributes,)
    
    def get_options(self) -> list:
        return (contains_eager(User.attributes),)

    def filter_by_pk(self, indexes) -> list:
        return (User.id == indexes['user'],)

    def filter_by(self, indexes, filters) -> list:
        where = []

        if 'st_name' in filters:
            where.append(User.st_name.ilike(f"%{filters['st_name']}%"))
        if 'st_email' in filters:
            where.append(User.st_email.ilike(f"%{filters['st_email']}%"))
        if 'st_phone' in filters:
            where.append(User.st_phone.ilike(f"%{filters['st_phone']}%"))
        if 'st_value' in filters:
            where.append(UserAttr.st_value.ilike(f"%{filters['st_value']}%"))

        return where + super().filter_by(indexes, filters)
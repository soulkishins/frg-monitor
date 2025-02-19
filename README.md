# FRG Monitor

Este repositório contém três componentes principais: `backend`, `crawler` e `frontend`. Cada um deles desempenha um papel crucial no monitoramento e análise de dados de anúncios.

## Estrutura do Repositório

- **backend**: Responsável por gerenciar a lógica de negócios e a interação com o banco de dados.
- **crawler**: Um serviço que coleta dados de anúncios de fontes externas.
- **frontend**: Interface de usuário para visualização e interação com os dados coletados.

---

## Backend

### Descrição

O backend é construído em Python e utiliza o SQLAlchemy para ORM e o AWS Secrets Manager para gerenciar credenciais de banco de dados.

### Configuração

1. **Instalação de Dependências**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configuração do Banco de Dados**:
   - Certifique-se de que as credenciais do banco de dados estão configuradas no AWS Secrets Manager.

3. **Execução**:
   - Inicie o servidor com o comando apropriado para o seu framework (por exemplo, `flask run` ou `uvicorn main:app`).

### Estrutura de Pastas

- `crud.py`: Contém operações CRUD para diferentes entidades.
- `db/`: Contém modelos de banco de dados e configuração de conexão.
- `operations/`: Implementa a lógica de negócios.

---

## Crawler

### Descrição

O crawler é um serviço TypeScript que coleta dados de anúncios de fontes externas, como o Mercado Livre, e os armazena no banco de dados.

### Configuração

1. **Instalação de Dependências**:
   ```bash
   npm install
   ```

2. **Configuração do AWS**:
   - Configure as credenciais do AWS para acessar S3, SQS e Secrets Manager.

3. **Execução**:
   - Inicie o crawler com:
     ```bash
     npm start
     ```

### Estrutura de Pastas

- `aws/`: Contém integrações com serviços AWS.
- `services/`: Implementa serviços de scraping e upload.
- `base/`: Configurações e tipos base.
- `test/`: Testes unitários.

### Testes E2E

Para executar os testes E2E, você pode enviar uma mensagem para a fila SQS com o seguinte corpo:

```json
{
    "keyword": "Máscara Nutricurls Wella 150g",
    "idBrand": "8eb1907c-0da7-4a37-8406-4f5066b77690",
    "brandProducts": [{
        "id_product": "d67caf98-f6a6-456c-b3b2-0237d177a386",
        "st_varity_seq": "1",
        "st_varity_name": "100ML"
    }]
}
```

### Deploy

```bash

cd ./dist && zip -r lambda_function.zip . && mv lambda_function.zip ../  && cd .. && zip -r lambda_function.zip ./node_modules

aws lambda update-function-code \
    --function-name near-crawler \
    --zip-file fileb://lambda_function.zip

```


---

## Frontend

### Descrição

O frontend é uma aplicação Angular que fornece uma interface de usuário para visualizar e interagir com os dados coletados.

### Configuração

1. **Instalação de Dependências**:
   ```bash
   npm install
   ```

2. **Execução**:
   - Inicie o servidor de desenvolvimento com:
     ```bash
     npm start
     ```

3. **Build**:
   - Para criar uma versão de produção:
     ```bash
     npm run build
     ```

### Estrutura de Pastas

- `src/app/layout/`: Contém componentes de layout e serviços.
- `src/app/models/`: Define modelos de dados usados na aplicação.

---

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

## Bastion Host

```bash

ssh -i "near.pem" -L 5432:matrix-db.czxtws3erove.sa-east-1.rds.amazonaws.com:5432 ec2-user@ec2-54-233-36-111.sa-east-1.compute.amazonaws.com

```
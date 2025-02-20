# SEFAZ Integration Lambda

A Python-based AWS Lambda function for integrating with SEFAZ (Brazilian tax authority) services. This project handles various document types including NFe, CTe, MDFe, and NFSe.

## Description

This service provides integration with different SEFAZ services, handling document distribution and consultation for:
- NFe (Electronic Invoice)
- CTe (Electronic Transport Knowledge)
- MDFe (Electronic Freight Manifest)
- NFSe (Electronic Service Invoice)

## Prerequisites

- Python 3.x
- AWS Lambda environment
- AWS credentials configured
- Required SEFAZ certificates

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Environment Variables
The following environment variables need to be configured:

- env: Environment identifier (e.g., 'prd', 'hml')
- s3_name: S3 bucket name
- s3_region: S3 bucket region
- secret_db: Database secret name
- secret_region: Database secret region

lambda-integracao-sefaz\
├── sefaz.py           # Main Lambda handler\
├── sefaz_utils.py     # Utility functions\
├── configs            # Configuration files\
├── db                 # Database models\
├── services           # Sefaz services implementations\
├── templates          # Sefaz input templates\
├── requirements.txt   # Project dependencies\
└── README.md          # Project documentation

## Testing
The Lambda function expects an event with the following structure

```json
{
    "entity": "{ID}",
    "username": "{USERNAME}",
    "uf": "SP|MG|RJ|...",
    "service": "nfeDistribuicaoDFeSoap|cteDistribuicaoDFeSoap|mdfeDistribuicaoDFeSoap|nfseDFeContribuinte|...",
    "values": {
        "cnpj": "{CNPJ}",
        "nsu_nfe": "{LAST_NSU}",
        "nsu_cte": "{LAST_NSU}",
        "nsu_mdfe": "{LAST_NSU}",
        "nsu_nfse": "{LAST_NSU}"
    }
}
```

## Updating Lambda source
```bash
zip -r lambda_function.zip . -x "*.git*" "*__pycache__*" "*.venv*" "*python*"

aws lambda update-function-code --function-name near-crud-client --zip-file fileb://lambda_function.zip

pip install -r requirements-pkg.txt -t python/

zip -r matrix-layer.zip python

```

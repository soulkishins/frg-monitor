import os

CONFIGS = {
    # Caminho do certificado e chave do cliente
    "cert": os.path.join(os.getcwd(), "cert.pem"),
    "key": os.path.join(os.getcwd(), "cert.key"),
    # Endpoint do serviço de homologação da SEFAZ SP
    "urls": {
        "nfeAutorização4": "https://homologacao.nfe.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx",
        "nfeRetAutorizacao4​": "https://homologacao.nfe.fazenda.sp.gov.br/ws/NFeRetAutorizacao4.asmx",
        "nfeInutilizacao4​": "https://homologacao.nfe.fazenda.sp.gov.br/ws/NFeInutilizacao4.asmx",
        "nfeConsultaProtocolo4​": "https://homologacao.nfe.fazenda.sp.gov.br/ws/NFeConsultaProtocolo4.asmx",
        "nfeRecepcaoEvento4​": "https://homologacao.nfe.fazenda.sp.gov.br/ws/NFeRecepcaoEvento4.asmx",
        "nfeStatusServico4": "https://homologacao.nfe.fazenda.sp.gov.br/ws/NFeStatusServico4.asmx",
        "nFeDistribuicaoDFeSoap": "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx"
    },
    "parameters": {
        "tpAmb": "2",
        "cUF": "35"
    }
}

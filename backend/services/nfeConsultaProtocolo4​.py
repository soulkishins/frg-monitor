def tratarInputs(xml: str, configs: dict, values: dict):
    xml = xml.replace("$tpAmb", configs['parameters']['tpAmb'])
    xml = xml.replace("$chNFe", values['chNFe'])
    return xml

def getHeader(configs: dict):
    return {
        "Content-Type": "application/soap+xml;charset=UTF-8;action=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF\"",
        "SOAPAction": "http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF"
    }
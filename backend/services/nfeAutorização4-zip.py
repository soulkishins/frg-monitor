def tratarInputs(xml: str, configs: dict, values: dict):
    xml = xml.replace("$tpAmb", configs['parameters']['tpAmb'])
    xml = xml.replace("$cUF", configs['parameters']['cUF'])
    return xml

def getHeader(configs: dict):
    return {
        "Content-Type": "application/soap+xml;charset=UTF-8;action=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLoteZip\"",
        "SOAPAction": "http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLoteZipF"
    }
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:nfed="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
    <soapenv:Header/>
    <soapenv:Body>
        <nfed:nfeDistDFeInteresse>
            <nfed:nfeDadosMsg>
                <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
                    <tpAmb>$tpAmb</tpAmb>
                    <cUFAutor>$cUFAutor</cUFAutor>
                    <CNPJ>$CNPJ</CNPJ>
                    <distNSU>
                        <ultNSU>$ultNSU</ultNSU>
                    </distNSU>
                </distDFeInt>
            </nfed:nfeDadosMsg>
        </nfed:nfeDistDFeInteresse>
    </soapenv:Body>
</soapenv:Envelope>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cted="http://www.portalfiscal.inf.br/cte/wsdl/CTeDistribuicaoDFe">
   <soapenv:Header/>
   <soapenv:Body>
      <cted:cteDistDFeInteresse>
         <cted:cteDadosMsg>
         		<distDFeInt versao="1.00" xmlns="http://www.portalfiscal.inf.br/cte">
         			<tpAmb>$tpAmb</tpAmb>
         			<cUFAutor>$cUFAutor</cUFAutor>
         			<CNPJ>$CNPJ</CNPJ>
         			<distNSU>
         				<ultNSU>$ultNSU</ultNSU>
				    </distNSU>
         		</distDFeInt>
         </cted:cteDadosMsg>
      </cted:cteDistDFeInteresse>
   </soapenv:Body>
</soapenv:Envelope>
"""
CFDI 4.0 XML Parser Service.
"""

import logging
from datetime import datetime
from decimal import Decimal
from typing import Any

import xmltodict
from lxml import etree

logger = logging.getLogger(__name__)

# CFDI 4.0 Namespaces
CFDI_NAMESPACES = {
    'cfdi': 'http://www.sat.gob.mx/cfd/4',
    'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital',
    'xsi': 'http://www.w3.org/2001/XMLSchema-instance',
}


class CFDIParseError(Exception):
    """Error during CFDI parsing."""
    pass


def parse_cfdi_xml(xml_content: bytes) -> dict[str, Any]:
    """
    Parse CFDI 4.0 XML file and extract relevant data.
    
    Args:
        xml_content: Raw XML content as bytes
        
    Returns:
        Dictionary with parsed CFDI data
        
    Raises:
        CFDIParseError: If parsing fails
    """
    try:
        # Parse XML
        root = etree.fromstring(xml_content)
        
        # Also parse with xmltodict for full structure
        full_dict = xmltodict.parse(xml_content)
        
        # Get the Comprobante element
        comprobante = root
        
        # Extract basic attributes
        data = {
            'version': comprobante.get('Version', '4.0'),
            'serie': comprobante.get('Serie', ''),
            'folio': comprobante.get('Folio', ''),
            'fecha': comprobante.get('Fecha', ''),
            'forma_pago': comprobante.get('FormaPago', ''),
            'condiciones_pago': comprobante.get('CondicionesDePago', ''),
            'subtotal': Decimal(comprobante.get('SubTotal', '0')),
            'descuento': Decimal(comprobante.get('Descuento', '0')),
            'moneda': comprobante.get('Moneda', 'MXN'),
            'tipo_cambio': Decimal(comprobante.get('TipoCambio', '1')),
            'total': Decimal(comprobante.get('Total', '0')),
            'tipo_comprobante': comprobante.get('TipoDeComprobante', ''),
            'exportacion': comprobante.get('Exportacion', ''),
            'metodo_pago': comprobante.get('MetodoPago', ''),
            'lugar_expedicion': comprobante.get('LugarExpedicion', ''),
        }
        
        # Parse Emisor (Issuer)
        emisor = comprobante.find('cfdi:Emisor', CFDI_NAMESPACES)
        if emisor is not None:
            data['emisor'] = {
                'rfc': emisor.get('Rfc', ''),
                'nombre': emisor.get('Nombre', ''),
                'regimen_fiscal': emisor.get('RegimenFiscal', ''),
            }
        else:
            data['emisor'] = {'rfc': '', 'nombre': '', 'regimen_fiscal': ''}
        
        # Parse Receptor (Receiver)
        receptor = comprobante.find('cfdi:Receptor', CFDI_NAMESPACES)
        if receptor is not None:
            data['receptor'] = {
                'rfc': receptor.get('Rfc', ''),
                'nombre': receptor.get('Nombre', ''),
                'domicilio_fiscal': receptor.get('DomicilioFiscalReceptor', ''),
                'regimen_fiscal': receptor.get('RegimenFiscalReceptor', ''),
                'uso_cfdi': receptor.get('UsoCFDI', ''),
            }
        else:
            data['receptor'] = {'rfc': '', 'nombre': '', 'uso_cfdi': ''}
        
        # Parse Conceptos (Line items)
        conceptos = []
        conceptos_elem = comprobante.find('cfdi:Conceptos', CFDI_NAMESPACES)
        if conceptos_elem is not None:
            for concepto in conceptos_elem.findall('cfdi:Concepto', CFDI_NAMESPACES):
                concepto_data = {
                    'clave_prod_serv': concepto.get('ClaveProdServ', ''),
                    'no_identificacion': concepto.get('NoIdentificacion', ''),
                    'cantidad': Decimal(concepto.get('Cantidad', '0')),
                    'clave_unidad': concepto.get('ClaveUnidad', ''),
                    'unidad': concepto.get('Unidad', ''),
                    'descripcion': concepto.get('Descripcion', ''),
                    'valor_unitario': Decimal(concepto.get('ValorUnitario', '0')),
                    'importe': Decimal(concepto.get('Importe', '0')),
                    'descuento': Decimal(concepto.get('Descuento', '0')),
                    'objeto_imp': concepto.get('ObjetoImp', ''),
                    'impuestos': {},
                }
                
                # Parse taxes for this concept
                impuestos_elem = concepto.find('cfdi:Impuestos', CFDI_NAMESPACES)
                if impuestos_elem is not None:
                    traslados = []
                    retenciones = []
                    
                    traslados_elem = impuestos_elem.find('cfdi:Traslados', CFDI_NAMESPACES)
                    if traslados_elem is not None:
                        for traslado in traslados_elem.findall('cfdi:Traslado', CFDI_NAMESPACES):
                            traslados.append({
                                'base': Decimal(traslado.get('Base', '0')),
                                'impuesto': traslado.get('Impuesto', ''),
                                'tipo_factor': traslado.get('TipoFactor', ''),
                                'tasa_cuota': Decimal(traslado.get('TasaOCuota', '0')),
                                'importe': Decimal(traslado.get('Importe', '0')),
                            })
                    
                    retenciones_elem = impuestos_elem.find('cfdi:Retenciones', CFDI_NAMESPACES)
                    if retenciones_elem is not None:
                        for retencion in retenciones_elem.findall('cfdi:Retencion', CFDI_NAMESPACES):
                            retenciones.append({
                                'base': Decimal(retencion.get('Base', '0')),
                                'impuesto': retencion.get('Impuesto', ''),
                                'tipo_factor': retencion.get('TipoFactor', ''),
                                'tasa_cuota': Decimal(retencion.get('TasaOCuota', '0')),
                                'importe': Decimal(retencion.get('Importe', '0')),
                            })
                    
                    concepto_data['impuestos'] = {
                        'traslados': traslados,
                        'retenciones': retenciones,
                    }
                
                conceptos.append(concepto_data)
        
        data['conceptos'] = conceptos
        
        # Parse global Impuestos (Taxes)
        impuestos_global = comprobante.find('cfdi:Impuestos', CFDI_NAMESPACES)
        if impuestos_global is not None:
            data['impuestos'] = {
                'total_impuestos_trasladados': Decimal(impuestos_global.get('TotalImpuestosTrasladados', '0')),
                'total_impuestos_retenidos': Decimal(impuestos_global.get('TotalImpuestosRetenidos', '0')),
            }
        else:
            data['impuestos'] = {
                'total_impuestos_trasladados': Decimal('0'),
                'total_impuestos_retenidos': Decimal('0'),
            }
        
        # Parse Complemento - TimbreFiscalDigital (UUID)
        complemento = comprobante.find('cfdi:Complemento', CFDI_NAMESPACES)
        if complemento is not None:
            timbre = complemento.find('tfd:TimbreFiscalDigital', CFDI_NAMESPACES)
            if timbre is not None:
                data['timbre'] = {
                    'uuid': timbre.get('UUID', ''),
                    'fecha_timbrado': timbre.get('FechaTimbrado', ''),
                    'rfc_prov_certif': timbre.get('RfcProvCertif', ''),
                    'no_certificado_sat': timbre.get('NoCertificadoSAT', ''),
                }
            else:
                data['timbre'] = {'uuid': ''}
        else:
            data['timbre'] = {'uuid': ''}
        
        # Store full parsed structure
        data['raw'] = full_dict
        
        return data
        
    except etree.XMLSyntaxError as e:
        logger.error(f"XML syntax error: {e}")
        raise CFDIParseError(f"Error de sintaxis XML: {e}")
    except Exception as e:
        logger.exception(f"Error parsing CFDI: {e}")
        raise CFDIParseError(f"Error al parsear CFDI: {e}")


def validate_cfdi_structure(data: dict) -> list[str]:
    """
    Validate CFDI parsed data structure.
    
    Returns:
        List of validation errors (empty if valid)
    """
    errors = []
    
    if not data.get('timbre', {}).get('uuid'):
        errors.append("No se encontró UUID en el timbre fiscal")
    
    if not data.get('emisor', {}).get('rfc'):
        errors.append("No se encontró RFC del emisor")
    
    if not data.get('receptor', {}).get('rfc'):
        errors.append("No se encontró RFC del receptor")
    
    if not data.get('conceptos'):
        errors.append("No se encontraron conceptos en la factura")
    
    if data.get('total', 0) <= 0:
        errors.append("El total de la factura debe ser mayor a cero")
    
    return errors

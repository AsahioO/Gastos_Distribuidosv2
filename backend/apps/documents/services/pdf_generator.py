"""
PDF Generation Service using WeasyPrint.
"""

import logging
from io import BytesIO
from pathlib import Path

from django.template import loader
from django.conf import settings

logger = logging.getLogger(__name__)

# Template directory
TEMPLATE_DIR = Path(__file__).parent.parent / 'templates' / 'documents'


def generate_pdf_from_html(html_content: str) -> bytes:
    """
    Generate PDF from HTML content using WeasyPrint.
    
    Args:
        html_content: HTML string to convert
        
    Returns:
        PDF content as bytes
    """
    try:
        from weasyprint import HTML, CSS
        
        # Base CSS for PDFs
        base_css = CSS(string='''
            @page {
                size: letter;
                margin: 2cm;
            }
            body {
                font-family: 'Helvetica', 'Arial', sans-serif;
                font-size: 10pt;
                line-height: 1.4;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .title {
                font-size: 14pt;
                font-weight: bold;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
            }
            .footer {
                position: fixed;
                bottom: 0;
                width: 100%;
                text-align: center;
                font-size: 8pt;
                color: #666;
            }
            .signature-line {
                margin-top: 50px;
                border-top: 1px solid #000;
                width: 200px;
                text-align: center;
                padding-top: 5px;
            }
        ''')
        
        html = HTML(string=html_content)
        pdf_buffer = BytesIO()
        html.write_pdf(pdf_buffer, stylesheets=[base_css])
        
        return pdf_buffer.getvalue()
        
    except ImportError:
        logger.error("WeasyPrint not installed")
        raise
    except Exception as e:
        logger.exception(f"Error generating PDF: {e}")
        raise


def render_template(template_name: str, context: dict) -> str:
    """
    Render a Django template to HTML string.
    
    Args:
        template_name: Name of the template file
        context: Template context dictionary
        
    Returns:
        Rendered HTML string
    """
    template = loader.get_template(f'documents/{template_name}')
    return template.render(context)


def generate_solicitud_pdf(solicitud) -> bytes:
    """Generate PDF for a SolicitudMaterial."""
    context = {
        'solicitud': solicitud,
        'detalles': solicitud.detalles.all(),
    }
    html = render_template('solicitud_material.html', context)
    return generate_pdf_from_html(html)


def generate_orden_compra_pdf(orden) -> bytes:
    """Generate PDF for an OrdenCompra."""
    context = {
        'orden': orden,
        'detalles': orden.detalles.all(),
        'proveedor': orden.proveedor,
    }
    html = render_template('orden_compra.html', context)
    return generate_pdf_from_html(html)


def generate_autorizacion_pdf(autorizacion) -> bytes:
    """Generate PDF for an AutorizacionPresupuestal."""
    context = {
        'autorizacion': autorizacion,
        'solicitud': autorizacion.solicitud_autorizacion,
    }
    html = render_template('autorizacion.html', context)
    return generate_pdf_from_html(html)

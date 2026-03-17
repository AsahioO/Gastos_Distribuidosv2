import logging
from io import BytesIO
from pathlib import Path
from django.utils import timezone

from django.template import loader
from django.conf import settings

logger = logging.getLogger(__name__)

# Template directory
TEMPLATE_DIR = Path(__file__).parent.parent / 'templates' / 'documents'


def get_base_context():
    """Obtiene el contexto base común para todos los PDFs (membrete, logos, etc.)"""
    from apps.companies.models import Company
    
    company = Company.objects.first()
    context = {'company': company}
    
    if company:
        if company.membrete and hasattr(company.membrete, 'path'):
            context['membrete_path'] = company.membrete.path
        if company.logo and hasattr(company.logo, 'path'):
            context['logo_path'] = company.logo.path
        if company.pie_pagina and hasattr(company.pie_pagina, 'path'):
            context['pie_path'] = company.pie_pagina.path
            
    return context


def get_firmantes_context(tipo_documento):
    """Obtiene los firmantes configurados para un tipo de documento"""
    from apps.companies.models import FirmanteDocumento
    
    firmantes = FirmanteDocumento.objects.filter(tipo_documento=tipo_documento).order_by('orden')
    firmantes_data = []
    
    for f in firmantes:
        firmantes_data.append({
            'nombre_completo': f.nombre_completo,
            'cargo': f.cargo,
            'sello_path': f.sello_imagen.path if f.sello_imagen and hasattr(f.sello_imagen, 'path') else None
        })
        
    return firmantes_data


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
        
        # Base CSS for PDFs is now mostly inside the HTML template
        # Just simple overrides if necessary
        base_css = CSS(string='''
            @page {
                size: letter;
                margin: 1cm;
            }
        ''')
        
        html = HTML(string=html_content, base_url=str(settings.BASE_DIR))
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
    context = get_base_context()
    
    # Contexto específico
    context.update({
        'solicitud': solicitud,
        'detalles': solicitud.detalles.all(),
        'area': solicitud.area,
        'fecha_solicitud': solicitud.fecha_solicitud,
        'lugar': 'Presidencia Municipal' # Consider making this dynamic later based on company
    })
    
    # Firmantes
    context['firmantes'] = get_firmantes_context('solicitud_material')
    
    html = render_template('solicitud_material.html', context)
    return generate_pdf_from_html(html)


def generate_orden_compra_pdf(orden) -> bytes:
    """Generate PDF for an OrdenCompra."""
    context = get_base_context()
    
    context.update({
        'orden': orden,
        'detalles': orden.detalles.all(),
        'proveedor': orden.proveedor,
    })
    
    # Firmantes
    context['firmantes'] = get_firmantes_context('orden_compra')
    
    html = render_template('orden_compra.html', context)
    return generate_pdf_from_html(html)


def generate_autorizacion_pdf(autorizacion) -> bytes:
    """Generate PDF for an AutorizacionPresupuestal."""
    context = get_base_context()

    context.update({
        'autorizacion': autorizacion,
        'solicitud': autorizacion.solicitud_autorizacion,
    })

    # Firmantes
    context['firmantes'] = get_firmantes_context('autorizacion')

    html = render_template('autorizacion.html', context)
    return generate_pdf_from_html(html)


def generate_cotizacion_pdf(cotizacion) -> bytes:
    """Generate PDF for a Cotizacion."""
    context = get_base_context()

    context.update({
        'cotizacion': cotizacion,
        'proveedor': cotizacion.proveedor,
        'detalles': cotizacion.detalles.all(),
        'lugar': 'Presidencia Municipal',
    })

    context['firmantes'] = get_firmantes_context('cotizacion')

    html = render_template('cotizacion.html', context)
    return generate_pdf_from_html(html)


def generate_entrega_pdf(entrega) -> bytes:
    """Generate PDF for an EntregaBienes."""
    context = get_base_context()

    context.update({
        'entrega': entrega,
        'orden': entrega.orden,
        'detalles': entrega.detalles.all(),
        'lugar': 'Presidencia Municipal',
    })

    context['firmantes'] = get_firmantes_context('entrega_bienes')

    html = render_template('entrega_bienes.html', context)
    return generate_pdf_from_html(html)


def generate_salida_pdf(salida) -> bytes:
    """Generate PDF for a SalidaAlmacen."""
    context = get_base_context()

    context.update({
        'salida': salida,
        'area': salida.area,
        'detalles': salida.detalles.all(),
        'lugar': 'Presidencia Municipal',
    })

    context['firmantes'] = get_firmantes_context('salida_almacen')

    html = render_template('salida_almacen.html', context)
    return generate_pdf_from_html(html)

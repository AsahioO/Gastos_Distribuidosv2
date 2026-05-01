import logging
from io import BytesIO
from pathlib import Path
from django.utils import timezone

from django.template import loader
from django.conf import settings

logger = logging.getLogger(__name__)


def merge_pdfs_in_memory(pdf_bytes_list: list[bytes]) -> bytes:
    """Merge multiple in-memory PDFs (as bytes) into a single PDF (bytes)."""
    import io
    from pypdf import PdfReader, PdfWriter

    writer = PdfWriter()
    for pdf_bytes in pdf_bytes_list:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            writer.add_page(page)
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


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


def generate_solicitud_autorizacion_pdf(solicitud_aut) -> bytes:
    """Generate PDF for a SolicitudAutorizacion."""
    context = get_base_context()

    context.update({
        'solicitud_aut': solicitud_aut,
        'solicitud': solicitud_aut.solicitud,
        'detalles': solicitud_aut.solicitud.detalles.all(),
        'cotizacion': solicitud_aut.cotizacion,
    })

    context['firmantes'] = get_firmantes_context('solicitud_autorizacion')

    html = render_template('solicitud_autorizacion.html', context)
    return generate_pdf_from_html(html)


def _safe_user_by_role(role_name):
    """Best-effort lookup of a user by role name. Returns None on any error."""
    try:
        from apps.accounts.models import User
        return User.objects.filter(role__name=role_name).first()
    except Exception:
        return None


def generate_solicitud_gasto_pdf(solicitud_gasto_id, tenant) -> bytes:
    """Generate PDF for a SolicitudGasto."""
    from decimal import Decimal
    from collections import defaultdict
    from apps.treasury.models import SolicitudGasto

    solicitud_gasto = SolicitudGasto.objects.select_related(
        'factura__proveedor', 'solicitante', 'tenant'
    ).prefetch_related('items__area').get(
        id=solicitud_gasto_id, tenant=tenant
    )

    subtotales_por_area = defaultdict(Decimal)
    for item in solicitud_gasto.items.all():
        subtotales_por_area[item.area_id] += item.costo_total

    context = get_base_context()
    context.update({
        'solicitud_gasto': solicitud_gasto,
        'lugar': context.get('company').municipio if context.get('company') else '',
        'presidente_municipal': _safe_user_by_role('PRESIDENTE'),
        'sindico_municipal': _safe_user_by_role('SINDICO'),
        'subtotales_por_area': dict(subtotales_por_area),
        'lema_anual': (tenant.settings or {}).get('lema_anual', ''),
    })

    context['firmantes'] = get_firmantes_context('solicitud_gasto')

    html = render_template('solicitud_gasto.html', context)
    return generate_pdf_from_html(html)


def generate_solicitud_pago_pdf(solicitud_pago_id, tenant) -> bytes:
    """Generate PDF for a SolicitudPago."""
    from apps.treasury.models import SolicitudPago

    solicitud_pago = SolicitudPago.objects.select_related(
        'solicitud_gasto__factura',
        'solicitud_gasto__factura__proveedor',
        'solicitud_gasto__solicitante'
    ).prefetch_related('items__area').get(
        id=solicitud_pago_id, tenant=tenant
    )

    context = get_base_context()
    context.update({
        'solicitud_pago': solicitud_pago,
        'lugar': context.get('company').municipio if context.get('company') else '',
        'tesorera': _safe_user_by_role('TESORERA'),
        'presidente_municipal': _safe_user_by_role('PRESIDENTE'),
        'lema_anual': (tenant.settings or {}).get('lema_anual', ''),
    })

    context['firmantes'] = get_firmantes_context('solicitud_pago')

    html = render_template('solicitud_pago.html', context)
    return generate_pdf_from_html(html)


def generate_distribucion_gasto_pdf(factura_id, tenant) -> bytes:
    """Generate PDF for the DistribucionGasto of a Factura."""
    from decimal import Decimal
    from collections import defaultdict
    from apps.invoices.models import Factura, DistribucionGasto

    factura = Factura.objects.select_related('proveedor').get(id=factura_id)

    distribuciones = (
        DistribucionGasto.objects
        .filter(factura=factura)
        .select_related('area', 'concepto')
        .order_by('area__name', 'id')
    )

    subtotales_por_area = defaultdict(Decimal)
    for d in distribuciones:
        subtotales_por_area[d.area_id] += d.monto

    context = get_base_context()
    context.update({
        'factura': factura,
        'distribuciones': distribuciones,
        'subtotales_por_area': dict(subtotales_por_area),
        'lugar': context.get('company').municipio if context.get('company') else '',
        'lema_anual': (tenant.settings or {}).get('lema_anual', '') if tenant else '',
    })

    context['firmantes'] = get_firmantes_context('distribucion_gasto')

    html = render_template('distribucion_gasto.html', context)
    return generate_pdf_from_html(html)


def generate_expediente_gasto_pdf(solicitud_gasto_id, tenant) -> bytes:
    """
    Generate a combined PDF:
      1. Solicitud de Gasto
      2. Distribucion de Gasto (from the linked factura)
      3. Solicitud de Pago (if exists)
    Returns bytes.
    """
    from apps.treasury.models import SolicitudGasto

    solicitud_gasto = SolicitudGasto.objects.select_related(
        'factura__proveedor', 'solicitante'
    ).prefetch_related('items__area').get(
        id=solicitud_gasto_id, tenant=tenant
    )

    gasto_bytes = generate_solicitud_gasto_pdf(solicitud_gasto_id, tenant)
    pdf_parts = [gasto_bytes]

    # Distribucion de gasto (from the linked factura)
    if solicitud_gasto.factura_id:
        try:
            dist_bytes = generate_distribucion_gasto_pdf(
                solicitud_gasto.factura_id, tenant
            )
            pdf_parts.append(dist_bytes)
        except Exception:
            logger.exception(
                "No se pudo generar distribucion_gasto para factura %s",
                solicitud_gasto.factura_id,
            )

    if hasattr(solicitud_gasto, 'solicitud_pago'):
        pago_bytes = generate_solicitud_pago_pdf(
            solicitud_gasto.solicitud_pago.id, tenant
        )
        pdf_parts.append(pago_bytes)

    if len(pdf_parts) == 1:
        return gasto_bytes

    return merge_pdfs_in_memory(pdf_parts)

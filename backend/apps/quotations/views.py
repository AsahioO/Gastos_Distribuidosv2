from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import CotizacionMaterial
from .serializers import (
    CotizacionMaterialSerializer,
    CotizacionMaterialCreateSerializer,
)
from apps.accounts.permissions import IsProveedor, IsAdquisiciones, IsTesoreria


class CotizacionMaterialViewSet(viewsets.ModelViewSet):
    queryset = CotizacionMaterial.objects.select_related('solicitud', 'proveedor').prefetch_related('detalles')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CotizacionMaterialCreateSerializer
        return CotizacionMaterialSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Providers only see their own quotes
        if user.is_proveedor and hasattr(user, 'proveedor_profile'):
            queryset = queryset.filter(proveedor=user.proveedor_profile)
        
        # Filter by solicitud
        solicitud_id = self.request.query_params.get('solicitud')
        if solicitud_id:
            queryset = queryset.filter(solicitud_id=solicitud_id)
        
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsTesoreria])
    def select(self, request, pk=None):
        """Select this quotation as winner."""
        cotizacion = self.get_object()
        
        # Reject other quotations for the same solicitud
        CotizacionMaterial.objects.filter(
            solicitud=cotizacion.solicitud
        ).exclude(id=cotizacion.id).update(
            estado=CotizacionMaterial.EstadoChoices.RECHAZADA
        )
        
        cotizacion.estado = CotizacionMaterial.EstadoChoices.SELECCIONADA
        cotizacion.save()
        
        # Update solicitud status
        from apps.procurement.models import SolicitudMaterial
        cotizacion.solicitud.estado = SolicitudMaterial.EstadoChoices.COTIZADO
        cotizacion.solicitud.save()
        
        return Response(CotizacionMaterialSerializer(cotizacion).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdquisiciones])
    def create_order(self, request, pk=None):
        """Generate purchase order from authorized quotation."""
        from decimal import Decimal
        from django.utils import timezone
        from apps.orders.models import OrdenCompra, DetalleOrden
        from apps.orders.serializers import OrdenCompraSerializer
        
        cotizacion = self.get_object()
        
        # Verificar que la cotización esté seleccionada
        if cotizacion.estado != CotizacionMaterial.EstadoChoices.SELECCIONADA:
            return Response(
                {'error': 'Solo se pueden generar órdenes de cotizaciones autorizadas.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que no exista ya una OC para esta cotización
        if cotizacion.ordenes_compra.exists():
            return Response(
                {'error': 'Ya existe una orden de compra para esta cotización.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Datos para la orden
        fecha_entrega = request.data.get('fecha_entrega_esperada')
        condiciones_pago = request.data.get('condiciones_pago', cotizacion.condiciones_pago)
        notas = request.data.get('notas', '')
        
        # Generar número de orden
        year = timezone.now().year
        count = OrdenCompra.objects.filter(created_at__year=year).count() + 1
        numero = f"OC-{year}-{count:05d}"
        
        # Crear orden de compra
        orden = OrdenCompra.objects.create(
            numero=numero,
            proveedor=cotizacion.proveedor,
            cotizacion=cotizacion,
            fecha_emision=timezone.now().date(),
            fecha_entrega_esperada=fecha_entrega,
            subtotal=cotizacion.subtotal,
            iva=cotizacion.iva,
            total=cotizacion.total,
            condiciones_pago=condiciones_pago,
            notas=notas,
            estado=OrdenCompra.EstadoChoices.BORRADOR,
            created_by=request.user
        )
        
        # Copiar detalles de la cotización a la orden
        for detalle_cot in cotizacion.detalles.all():
            DetalleOrden.objects.create(
                orden=orden,
                detalle_material=detalle_cot.detalle_material,
                concepto=detalle_cot.concepto,
                descripcion=detalle_cot.descripcion or '',
                cantidad=detalle_cot.cantidad,
                unidad=detalle_cot.unidad,
                precio_unitario=detalle_cot.precio_unitario,
                subtotal=detalle_cot.subtotal
            )
        
        # Actualizar estado de solicitud
        from apps.procurement.models import SolicitudMaterial
        cotizacion.solicitud.estado = SolicitudMaterial.EstadoChoices.EN_ORDEN
        cotizacion.solicitud.save()
        
        return Response(OrdenCompraSerializer(orden).data, status=status.HTTP_201_CREATED)

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import SolicitudAutorizacion, AutorizacionPresupuestal, OrdenCompra
from .serializers import (
    SolicitudAutorizacionSerializer,
    AutorizacionPresupuestalSerializer,
    OrdenCompraSerializer,
    OrdenCompraCreateSerializer,
)
from apps.accounts.permissions import IsTesoreria, IsAdquisiciones, IsProveedor


class SolicitudAutorizacionViewSet(viewsets.ModelViewSet):
    queryset = SolicitudAutorizacion.objects.select_related(
        'solicitud', 'cotizacion', 'solicitante'
    ).prefetch_related('autorizacion_presupuestal')
    serializer_class = SolicitudAutorizacionSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(solicitante=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsTesoreria])
    def approve(self, request, pk=None):
        """Approve authorization request."""
        solicitud = self.get_object()
        
        if solicitud.estado != SolicitudAutorizacion.EstadoChoices.PENDIENTE:
            return Response(
                {'error': 'Esta solicitud ya fue procesada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        monto = request.data.get('monto_autorizado', solicitud.monto_solicitado)
        
        AutorizacionPresupuestal.objects.create(
            solicitud_autorizacion=solicitud,
            monto_autorizado=monto,
            partida_presupuestal=request.data.get('partida_presupuestal', ''),
            fecha_aprobacion=timezone.now().date(),
            observaciones=request.data.get('observaciones', ''),
            aprobado_por=request.user
        )
        
        solicitud.estado = SolicitudAutorizacion.EstadoChoices.APROBADA
        solicitud.save()
        
        # Update solicitud material status
        from apps.procurement.models import SolicitudMaterial
        solicitud.solicitud.estado = SolicitudMaterial.EstadoChoices.AUTORIZADO
        solicitud.solicitud.save()
        
        return Response(SolicitudAutorizacionSerializer(solicitud).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsTesoreria])
    def reject(self, request, pk=None):
        """Reject authorization request."""
        solicitud = self.get_object()
        
        solicitud.estado = SolicitudAutorizacion.EstadoChoices.RECHAZADA
        solicitud.save()
        
        return Response(SolicitudAutorizacionSerializer(solicitud).data)


class OrdenCompraViewSet(viewsets.ModelViewSet):
    queryset = OrdenCompra.objects.select_related(
        'proveedor', 'autorizacion', 'cotizacion', 'created_by'
    ).prefetch_related('detalles')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrdenCompraCreateSerializer
        return OrdenCompraSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.is_proveedor and hasattr(user, 'proveedor_profile'):
            queryset = queryset.filter(proveedor=user.proveedor_profile)
        
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdquisiciones])
    def send(self, request, pk=None):
        """Send order to provider."""
        orden = self.get_object()
        
        if orden.estado != OrdenCompra.EstadoChoices.BORRADOR:
            return Response(
                {'error': 'Solo se pueden enviar órdenes en borrador.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        orden.estado = OrdenCompra.EstadoChoices.ENVIADA
        orden.save()
        
        # TODO: Send email notification to provider
        
        return Response(OrdenCompraSerializer(orden).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsProveedor])
    def confirm(self, request, pk=None):
        """Provider confirms the order."""
        orden = self.get_object()
        
        if orden.estado != OrdenCompra.EstadoChoices.ENVIADA:
            return Response(
                {'error': 'Esta orden no puede ser confirmada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        orden.estado = OrdenCompra.EstadoChoices.CONFIRMADA
        orden.referencia_externa = request.data.get('referencia_externa', '')
        orden.save()
        
        return Response(OrdenCompraSerializer(orden).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdquisiciones])
    def cancel(self, request, pk=None):
        """Cancel the order."""
        orden = self.get_object()
        
        if orden.estado in [OrdenCompra.EstadoChoices.ENTREGADA, OrdenCompra.EstadoChoices.CANCELADA]:
            return Response(
                {'error': 'Esta orden no puede ser cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        orden.estado = OrdenCompra.EstadoChoices.CANCELADA
        orden.save()
        
        return Response(OrdenCompraSerializer(orden).data)

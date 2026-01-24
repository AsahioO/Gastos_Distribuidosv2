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

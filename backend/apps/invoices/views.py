from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Factura, FacturaDetalle, DistribucionGasto
from .serializers import (
    FacturaSerializer,
    FacturaUploadSerializer,
    FacturaDetalleSerializer,
    DistribucionGastoSerializer,
    DistributeRequestSerializer,
)
from .tasks import process_cfdi_xml, distribute_invoice_expenses
from apps.accounts.permissions import IsTesoreria


class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.select_related('proveedor', 'uploaded_by').prefetch_related('conceptos', 'distribuciones')
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.action == 'upload':
            return FacturaUploadSerializer
        return FacturaSerializer
    
    def get_permissions(self):
        if self.action in ['upload', 'distribute']:
            return [IsAuthenticated(), IsTesoreria()]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        proveedor_id = self.request.query_params.get('proveedor')
        if proveedor_id:
            queryset = queryset.filter(proveedor_id=proveedor_id)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload a CFDI XML file for processing."""
        serializer = FacturaUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        factura = serializer.save(uploaded_by=request.user)
        
        # Queue async task to process the XML
        process_cfdi_xml.delay(factura.id)
        
        return Response(
            {
                'id': factura.id,
                'message': 'Factura recibida. El procesamiento se realizará en segundo plano.',
                'status': factura.status
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def parsed(self, request, pk=None):
        """Get parsed JSON data for a factura."""
        factura = self.get_object()
        
        if factura.status != Factura.EstadoChoices.PROCESADA and factura.status != Factura.EstadoChoices.DISTRIBUIDA:
            return Response(
                {'error': 'La factura aún no ha sido procesada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(factura.parsed_json)
    
    @action(detail=True, methods=['post'], permission_classes=[IsTesoreria])
    def distribute(self, request, pk=None):
        """Distribute invoice expenses to areas."""
        factura = self.get_object()
        
        if factura.status not in [Factura.EstadoChoices.PROCESADA, Factura.EstadoChoices.DISTRIBUIDA]:
            return Response(
                {'error': 'La factura debe estar procesada para distribuir.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = DistributeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Add created_by to each distribution
        distributions = serializer.validated_data['distributions']
        for dist in distributions:
            dist['created_by_id'] = request.user.id
        
        # Queue async task
        distribute_invoice_expenses.delay(factura.id, distributions)
        
        return Response({
            'message': 'La distribución se procesará en segundo plano.'
        })
    
    @action(detail=True, methods=['post'])
    def reprocess(self, request, pk=None):
        """Reprocess a failed factura."""
        factura = self.get_object()
        
        if factura.status != Factura.EstadoChoices.ERROR:
            return Response(
                {'error': 'Solo se pueden reprocesar facturas con error.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset status and requeue
        factura.status = Factura.EstadoChoices.PENDIENTE
        factura.error_message = ''
        factura.save()
        
        process_cfdi_xml.delay(factura.id)
        
        return Response({'message': 'Reprocesamiento iniciado.'})


class FacturaDetalleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FacturaDetalle.objects.select_related('factura')
    serializer_class = FacturaDetalleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        factura_id = self.request.query_params.get('factura')
        if factura_id:
            queryset = queryset.filter(factura_id=factura_id)
        return queryset

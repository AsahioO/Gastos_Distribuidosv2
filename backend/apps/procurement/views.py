from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models as db_models

from .models import Cog, SolicitudMaterial, DetalleMaterial
from .serializers import (
    CogSerializer,
    SolicitudMaterialSerializer,
    SolicitudMaterialCreateSerializer,
    DetalleMaterialSerializer,
)
from apps.accounts.permissions import IsAdmin, IsArea, IsAdquisiciones


class CogViewSet(viewsets.ModelViewSet):
    queryset = Cog.objects.all()
    serializer_class = CogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Catálogo completo, sin paginar
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get('active_only'):
            queryset = queryset.filter(is_active=True)
        
        # Search by codigo, descripcion or palabras_clave
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                db_models.Q(codigo__icontains=search) |
                db_models.Q(descripcion__icontains=search) |
                db_models.Q(palabras_clave__icontains=search)
            )
        
        return queryset


class SolicitudMaterialViewSet(viewsets.ModelViewSet):
    queryset = SolicitudMaterial.objects.select_related('area', 'created_by').prefetch_related('detalles')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SolicitudMaterialCreateSerializer
        return SolicitudMaterialSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Filter based on role
        if user.is_area:
            # Areas see their own requests and those from areas they manage
            from django.db.models import Q
            queryset = queryset.filter(
                Q(created_by=user) | Q(area__manager=user)
            )
        
        # Filter by estado
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        
        # Filter by area
        area_id = self.request.query_params.get('area')
        if area_id:
            queryset = queryset.filter(area_id=area_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Override create to return full serializer with ID."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(created_by=request.user)
        
        # Return with full serializer that includes ID and all fields
        output_serializer = SolicitudMaterialSerializer(instance)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit request for processing."""
        solicitud = self.get_object()
        
        if solicitud.estado != SolicitudMaterial.EstadoChoices.BORRADOR:
            return Response(
                {'error': 'Solo se pueden enviar solicitudes en borrador.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not solicitud.detalles.exists():
            return Response(
                {'error': 'La solicitud debe tener al menos un detalle.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        solicitud.estado = SolicitudMaterial.EstadoChoices.ENVIADO
        solicitud.save()
        
        return Response(SolicitudMaterialSerializer(solicitud).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a request."""
        solicitud = self.get_object()
        
        cancelable_states = [
            SolicitudMaterial.EstadoChoices.BORRADOR,
            SolicitudMaterial.EstadoChoices.ENVIADO,
        ]
        
        if solicitud.estado not in cancelable_states:
            return Response(
                {'error': 'Esta solicitud no puede ser cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        solicitud.estado = SolicitudMaterial.EstadoChoices.CANCELADO
        solicitud.save()
        
        return Response(SolicitudMaterialSerializer(solicitud).data)
        
    @action(detail=True, methods=['get'])
    def generar_pdf(self, request, pk=None):
        """Genera el PDF de la solicitud de material."""
        from django.http import HttpResponse
        from apps.documents.services.pdf_generator import generate_solicitud_pdf
        
        solicitud = self.get_object()
        
        try:
            pdf_bytes = generate_solicitud_pdf(solicitud)
            
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="solicitud_{solicitud.numero}.pdf"'
            return response
        except Exception as e:
            return Response(
                {'error': f'Error generando PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def send_to_quotation(self, request, pk=None):
        """
        Enviar solicitud a cotización (solo Adquisiciones o Admin).
        Cambia el estado de 'enviado' a 'en_cotizacion'.
        """
        solicitud = self.get_object()
        user = request.user
        
        # Verificar permisos: solo adquisiciones o admin
        if not (user.is_admin or user.is_adquisiciones):
            return Response(
                {'error': 'No tiene permisos para realizar esta acción.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if solicitud.estado != SolicitudMaterial.EstadoChoices.ENVIADO:
            return Response(
                {'error': 'Solo se pueden enviar a cotización solicitudes en estado "enviado".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        solicitud.estado = SolicitudMaterial.EstadoChoices.EN_COTIZACION
        solicitud.save()
        
        return Response(SolicitudMaterialSerializer(solicitud).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def buscar_cotizaciones_catalogo(self, request, pk=None):
        """
        Busca en los catálogos de proveedores y genera cotizaciones automáticas.
        Solo para adquisiciones o admin. La solicitud debe estar en_cotizacion.
        """
        solicitud = self.get_object()
        user = request.user

        if not (user.is_admin or user.is_adquisiciones):
            return Response(
                {'error': 'No tiene permisos para realizar esta acción.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if solicitud.estado not in [
            SolicitudMaterial.EstadoChoices.EN_COTIZACION,
            SolicitudMaterial.EstadoChoices.COTIZADO,
        ]:
            return Response(
                {'error': 'La solicitud debe estar en cotización para buscar en catálogos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from apps.quotations.services import generar_cotizaciones_automaticas
        resultado = generar_cotizaciones_automaticas(solicitud)

        return Response({
            'cotizaciones_creadas': len(resultado['cotizaciones_creadas']),
            'cotizaciones_ids': [c.id for c in resultado['cotizaciones_creadas']],
            'proveedores_parciales': resultado['proveedores_parciales'],
            'sin_cobertura': resultado['sin_cobertura'],
        })


class DetalleMaterialViewSet(viewsets.ModelViewSet):
    queryset = DetalleMaterial.objects.select_related('solicitud', 'cog')
    serializer_class = DetalleMaterialSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        solicitud_id = self.request.query_params.get('solicitud')
        if solicitud_id:
            queryset = queryset.filter(solicitud_id=solicitud_id)
        return queryset

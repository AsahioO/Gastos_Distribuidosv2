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
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get('active_only'):
            queryset = queryset.filter(is_active=True)
        
        # Search by codigo or descripcion
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                db_models.Q(codigo__icontains=search) |
                db_models.Q(descripcion__icontains=search)
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
            # Areas only see their own requests
            queryset = queryset.filter(created_by=user)
        
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

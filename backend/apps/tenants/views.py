from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Tenant, SolicitudGubernamental, Domain
from .serializers import (
    TenantSerializer,
    SolicitudGubernamentalSerializer,
    SolicitudGubernamentalCreateSerializer,
    SolicitudApprovalSerializer,
)
from apps.accounts.permissions import IsAdmin


class TenantViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing and retrieving tenants.
    Only admins can access.
    """
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get('active_only'):
            queryset = queryset.filter(is_active=True)
        return queryset


class SolicitudGubernamentalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for government registration requests.
    """
    queryset = SolicitudGubernamental.objects.all()
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SolicitudGubernamentalCreateSerializer
        return SolicitudGubernamentalSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset
    
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """
        Approve or reject a registration request.
        """
        solicitud = self.get_object()
        
        if solicitud.estado != SolicitudGubernamental.EstadoChoices.PENDIENTE:
            return Response(
                {'error': 'Esta solicitud ya fue procesada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SolicitudApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        action_type = serializer.validated_data['action']
        
        if action_type == 'approve':
            # Create tenant and domain
            subdomain = serializer.validated_data['subdomain']
            
            tenant = Tenant.objects.create(
                schema_name=subdomain,
                name=solicitud.nombre_organizacion,
                rfc=solicitud.rfc,
            )
            
            Domain.objects.create(
                domain=f'{subdomain}.localhost',
                tenant=tenant,
                is_primary=True
            )
            
            solicitud.estado = SolicitudGubernamental.EstadoChoices.APROBADA
            solicitud.tenant = tenant
            
        else:
            solicitud.estado = SolicitudGubernamental.EstadoChoices.RECHAZADA
            solicitud.rejection_reason = serializer.validated_data.get('rejection_reason', '')
        
        solicitud.reviewed_by = request.user
        solicitud.reviewed_at = timezone.now()
        solicitud.save()
        
        return Response(SolicitudGubernamentalSerializer(solicitud).data)

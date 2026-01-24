from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Company, Proveedor
from .serializers import CompanySerializer, ProveedorSerializer, ProveedorSignupSerializer
from apps.accounts.permissions import IsAdmin, IsAdquisiciones
from apps.accounts.models import User, Role


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'signup':
            return [AllowAny()]
        if self.action in ['approve', 'suspend']:
            return [IsAuthenticated(), IsAdquisiciones()]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        if user.is_proveedor and hasattr(user, 'proveedor_profile'):
            return Proveedor.objects.filter(id=user.proveedor_profile.id)
        return super().get_queryset()
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def signup(self, request):
        """Provider self-registration."""
        serializer = ProveedorSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get or create provider role
        role, _ = Role.objects.get_or_create(
            name=Role.RoleType.PROVEEDOR,
            defaults={
                'description': 'Rol para proveedores externos',
                'permissions': Role.get_default_permissions(Role.RoleType.PROVEEDOR)
            }
        )
        
        # Create user account
        user = User.objects.create_user(
            username=serializer.validated_data['rfc'].lower(),
            email=serializer.validated_data['contacto_email'],
            password=serializer.validated_data.pop('password'),
            full_name=serializer.validated_data['contacto_nombre'],
            role=role
        )
        
        # Create provider profile
        proveedor = Proveedor.objects.create(
            user=user,
            **serializer.validated_data
        )
        
        return Response(
            ProveedorSerializer(proveedor).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending provider."""
        proveedor = self.get_object()
        proveedor.estado = Proveedor.EstadoChoices.ACTIVO
        proveedor.save()
        return Response(ProveedorSerializer(proveedor).data)
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a provider."""
        proveedor = self.get_object()
        proveedor.estado = Proveedor.EstadoChoices.SUSPENDIDO
        proveedor.save()
        return Response(ProveedorSerializer(proveedor).data)

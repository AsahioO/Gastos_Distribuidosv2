from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User, Role
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    RoleSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsAdmin


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view with additional user info."""
    serializer_class = CustomTokenObtainPairSerializer


class RoleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing roles."""
    
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @action(detail=False, methods=['get'])
    def list_types(self, request):
        """List all available role types."""
        return Response([
            {'value': choice[0], 'label': choice[1]}
            for choice in Role.RoleType.choices
        ])


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users."""
    
    queryset = User.objects.select_related('role').all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Non-admin users can only see themselves
        if not user.is_admin:
            queryset = queryset.filter(id=user.id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current authenticated user."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'])
    def update_me(self, request):
        """Update current authenticated user."""
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change password for current user."""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Contraseña actual incorrecta.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Contraseña actualizada correctamente.'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def toggle_active(self, request, pk=None):
        """Toggle user active status."""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({'is_active': user.is_active})

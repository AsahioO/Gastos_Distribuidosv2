from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, ProveedorViewSet, ProductoProveedorViewSet

router = DefaultRouter()
router.register(r'empresas', CompanyViewSet, basename='company')
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'catalogo-productos', ProductoProveedorViewSet, basename='producto-proveedor')

urlpatterns = [
    path('', include(router.urls)),
]

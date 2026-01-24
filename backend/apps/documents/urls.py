from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PDFDocumentViewSet, MediaViewSet

router = DefaultRouter()
router.register(r'pdf', PDFDocumentViewSet, basename='pdf')
router.register(r'media', MediaViewSet, basename='media')

urlpatterns = [
    path('', include(router.urls)),
]

"""
Company models (AntePubli in the original system).
"""

from django.db import models
from django.conf import settings


class Company(models.Model):
    """
    Company model (previously AntePubli).
    Represents an organization within a tenant.
    """
    
    rfc = models.CharField(max_length=13, unique=True, verbose_name='RFC')
    razon_social = models.CharField(max_length=255, verbose_name='Razón Social')
    nombre_comercial = models.CharField(max_length=255, blank=True, verbose_name='Nombre Comercial')
    
    # Address
    calle = models.CharField(max_length=255, blank=True, verbose_name='Calle')
    numero_exterior = models.CharField(max_length=20, blank=True, verbose_name='Número Exterior')
    numero_interior = models.CharField(max_length=20, blank=True, verbose_name='Número Interior')
    colonia = models.CharField(max_length=255, blank=True, verbose_name='Colonia')
    municipio = models.CharField(max_length=255, blank=True, verbose_name='Municipio')
    estado = models.CharField(max_length=100, blank=True, verbose_name='Estado')
    codigo_postal = models.CharField(max_length=10, blank=True, verbose_name='Código Postal')
    
    # Contact
    telefono = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    email = models.EmailField(blank=True, verbose_name='Correo electrónico')
    
    # Branding
    logo = models.ImageField(
        upload_to='company_logos/',
        blank=True,
        null=True,
        verbose_name='Logo'
    )
    
    # Status
    is_active = models.BooleanField(default=True, verbose_name='Activa')
    
    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='companies_created',
        verbose_name='Creado por'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')

    class Meta:
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
        ordering = ['razon_social']

    def __str__(self):
        return self.razon_social

    @property
    def direccion_completa(self):
        """Return complete address as string."""
        parts = [
            self.calle,
            self.numero_exterior,
            self.colonia,
            self.municipio,
            self.estado,
            self.codigo_postal
        ]
        return ', '.join(filter(None, parts))


class Proveedor(models.Model):
    """
    Supplier/Provider model for external companies.
    """
    
    class EstadoChoices(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        ACTIVO = 'activo', 'Activo'
        SUSPENDIDO = 'suspendido', 'Suspendido'
    
    # Basic info
    rfc = models.CharField(max_length=13, unique=True, verbose_name='RFC')
    razon_social = models.CharField(max_length=255, verbose_name='Razón Social')
    nombre_comercial = models.CharField(max_length=255, blank=True, verbose_name='Nombre Comercial')
    
    # Contact
    contacto_nombre = models.CharField(max_length=255, blank=True, verbose_name='Nombre de contacto')
    contacto_email = models.EmailField(verbose_name='Email de contacto')
    contacto_telefono = models.CharField(max_length=20, blank=True, verbose_name='Teléfono de contacto')
    
    # Address
    direccion = models.TextField(blank=True, verbose_name='Dirección')
    
    # Branding
    logo = models.ImageField(
        upload_to='proveedor_logos/',
        blank=True,
        null=True,
        verbose_name='Logo'
    )
    
    # Status
    estado = models.CharField(
        max_length=20,
        choices=EstadoChoices.choices,
        default=EstadoChoices.PENDIENTE,
        verbose_name='Estado'
    )
    
    # Link to user account (for provider portal)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='proveedor_profile',
        verbose_name='Usuario'
    )
    
    # Documents
    documentos = models.JSONField(default=list, blank=True, verbose_name='Documentos')
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de registro')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')

    class Meta:
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['razon_social']

    def __str__(self):
        return self.razon_social

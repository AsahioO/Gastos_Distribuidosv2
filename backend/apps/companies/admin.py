from django.contrib import admin
from .models import Company, Proveedor


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['razon_social', 'rfc', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'estado', 'created_at']
    search_fields = ['razon_social', 'rfc', 'nombre_comercial', 'email']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    
    fieldsets = (
        ('Información General', {
            'fields': ('rfc', 'razon_social', 'nombre_comercial')
        }),
        ('Dirección', {
            'fields': ('calle', 'numero_exterior', 'numero_interior', 'colonia', 
                      'municipio', 'estado', 'codigo_postal')
        }),
        ('Contacto', {
            'fields': ('telefono', 'email')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ['razon_social', 'rfc', 'contacto_email', 'estado', 'created_at']
    list_filter = ['estado', 'created_at']
    search_fields = ['razon_social', 'rfc', 'contacto_nombre', 'contacto_email']
    readonly_fields = ['created_at', 'updated_at']

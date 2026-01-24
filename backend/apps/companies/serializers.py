from rest_framework import serializers
from .models import Company, Proveedor


class CompanySerializer(serializers.ModelSerializer):
    direccion_completa = serializers.ReadOnlyField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'rfc', 'razon_social', 'nombre_comercial',
            'calle', 'numero_exterior', 'numero_interior', 'colonia',
            'municipio', 'estado', 'codigo_postal', 'direccion_completa',
            'telefono', 'email', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = [
            'id', 'rfc', 'razon_social', 'nombre_comercial',
            'contacto_nombre', 'contacto_email', 'contacto_telefono',
            'direccion', 'estado', 'documentos', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'estado', 'created_at', 'updated_at']


class ProveedorSignupSerializer(serializers.ModelSerializer):
    """Serializer for provider self-registration."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = Proveedor
        fields = [
            'rfc', 'razon_social', 'nombre_comercial',
            'contacto_nombre', 'contacto_email', 'contacto_telefono',
            'direccion', 'password'
        ]
    
    def validate_rfc(self, value):
        value = value.upper().strip()
        if Proveedor.objects.filter(rfc=value).exists():
            raise serializers.ValidationError("Este RFC ya está registrado.")
        return value

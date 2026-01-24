from rest_framework import serializers
from .models import Factura, FacturaDetalle, DistribucionGasto


class FacturaDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacturaDetalle
        fields = [
            'id', 'clave_prod_serv', 'no_identificacion', 'cantidad',
            'clave_unidad', 'unidad', 'descripcion', 'valor_unitario',
            'importe', 'descuento', 'objeto_imp', 'impuestos'
        ]
        read_only_fields = ['id']


class DistribucionGastoSerializer(serializers.ModelSerializer):
    area_nombre = serializers.CharField(source='area.name', read_only=True)
    concepto_descripcion = serializers.CharField(source='concepto.descripcion', read_only=True)
    
    class Meta:
        model = DistribucionGasto
        fields = [
            'id', 'concepto', 'concepto_descripcion', 'area', 'area_nombre',
            'solicitud', 'monto', 'porcentaje', 'notas', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FacturaSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source='proveedor.razon_social', read_only=True)
    conceptos = FacturaDetalleSerializer(many=True, read_only=True)
    distribuciones = DistribucionGastoSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Factura
        fields = [
            'id', 'proveedor', 'proveedor_nombre', 'xml_file', 'pdf_file',
            'uuid_cfdi', 'folio', 'serie', 'fecha',
            'rfc_emisor', 'nombre_emisor', 'rfc_receptor', 'nombre_receptor',
            'subtotal', 'descuento', 'iva', 'isr', 'iva_retenido', 'total',
            'forma_pago', 'metodo_pago', 'moneda', 'tipo_cambio',
            'tipo_comprobante', 'uso_cfdi', 'status', 'status_display',
            'error_message', 'conceptos', 'distribuciones',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'uuid_cfdi', 'folio', 'serie', 'fecha',
            'rfc_emisor', 'nombre_emisor', 'rfc_receptor', 'nombre_receptor',
            'subtotal', 'descuento', 'iva', 'isr', 'iva_retenido', 'total',
            'forma_pago', 'metodo_pago', 'moneda', 'tipo_cambio',
            'tipo_comprobante', 'uso_cfdi', 'status', 'error_message',
            'created_at', 'updated_at'
        ]


class FacturaUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Factura
        fields = ['proveedor', 'xml_file', 'pdf_file']


class DistributeRequestSerializer(serializers.Serializer):
    """Serializer for distribution request."""
    
    distributions = serializers.ListField(
        child=serializers.DictField()
    )
    
    def validate_distributions(self, value):
        if not value:
            raise serializers.ValidationError("Se requiere al menos una distribución.")
        
        for dist in value:
            if 'area_id' not in dist:
                raise serializers.ValidationError("Cada distribución requiere area_id.")
            if 'concepto_id' not in dist:
                raise serializers.ValidationError("Cada distribución requiere concepto_id.")
            if 'monto' not in dist:
                raise serializers.ValidationError("Cada distribución requiere monto.")
        
        return value

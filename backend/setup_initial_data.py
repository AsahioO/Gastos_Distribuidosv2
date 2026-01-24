#!/usr/bin/env python
"""
Script para crear datos iniciales del sistema.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')

# Setup Django
django.setup()

from apps.accounts.models import Role, User
from apps.tenants.models import Tenant

def create_roles():
    """Crear roles del sistema."""
    roles = [
        ('admin', 'Administrador del Sistema'),
        ('tesoreria', 'Tesorería'),
        ('adquisiciones', 'Adquisiciones'),
        ('almacen', 'Almacén'),
        ('area', 'Área Solicitante'),
        ('proveedor', 'Proveedor'),
    ]
    for code, description in roles:
        role, created = Role.objects.get_or_create(
            name=code, 
            defaults={'description': description}
        )
        status = 'creado' if created else 'ya existe'
        print(f'  Rol [{code}]: {status}')

def create_superuser():
    """Crear superusuario admin."""
    if User.objects.filter(username='admin').exists():
        print('  Superusuario admin ya existe')
        return
    
    admin_role = Role.objects.get(name='admin')
    user = User.objects.create_superuser(
        username='admin',
        email='admin@gastos.local',
        password='admin123',
        first_name='Administrador',
        last_name='Sistema',
        role=admin_role
    )
    print(f'  Superusuario creado: {user.username} / admin123')

def create_tenant():
    """Crear tenant de desarrollo."""
    tenant, created = Tenant.objects.get_or_create(
        schema_name='public',
        defaults={
            'name': 'Organización Demo',
            'rfc': 'XAXX010101000',
            'is_active': True
        }
    )
    status = 'creado' if created else 'ya existe'
    print(f'  Tenant [{tenant.schema_name}]: {status}')

if __name__ == '__main__':
    print('=' * 50)
    print('Configuración Inicial - Gastos Distribuidos')
    print('=' * 50)
    
    print('\n1. Creando roles...')
    create_roles()
    
    print('\n2. Creando superusuario...')
    create_superuser()
    
    print('\n3. Creando tenant de desarrollo...')
    create_tenant()
    
    print('\n' + '=' * 50)
    print('¡Configuración completada!')
    print('=' * 50)
    print('\nCredenciales de acceso:')
    print('  Usuario: admin')
    print('  Contraseña: admin123')
    print('  Email: admin@gastos.local')

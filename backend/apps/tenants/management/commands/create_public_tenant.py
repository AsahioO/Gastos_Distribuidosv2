"""
Management command to create the public tenant required by django-tenants.
Safe to run multiple times (idempotent).
"""

from django.core.management.base import BaseCommand
from decouple import config


class Command(BaseCommand):
    help = 'Creates the public tenant and its domain if they do not exist'

    def handle(self, *args, **options):
        from apps.tenants.models import Tenant, Domain

        domain_name = config('PUBLIC_DOMAIN', default='localhost')

        # Create public tenant if it doesn't exist
        tenant, created = Tenant.objects.get_or_create(
            schema_name='public',
            defaults={'name': 'Public'}
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Public tenant created'))
        else:
            self.stdout.write('Public tenant already exists')

        # Create domain if it doesn't exist
        domain, created = Domain.objects.get_or_create(
            domain=domain_name,
            defaults={'tenant': tenant, 'is_primary': True}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Domain "{domain_name}" created'))
        else:
            self.stdout.write(f'Domain "{domain_name}" already exists')

# -*- mode: python ; coding: utf-8 -*-

import os
from pathlib import Path

block_cipher = None

PROJECT_DIR = Path(os.path.abspath(SPECPATH))
FRONTEND_DIST = PROJECT_DIR.parent / 'frontend' / 'dist'

if not FRONTEND_DIST.exists():
    raise FileNotFoundError(
        f'Frontend build not found at: {FRONTEND_DIST}\n'
        'Build it first: cd frontend && npm run build'
    )

datas = [
    (str(FRONTEND_DIST), 'frontend/dist'),
    (str(PROJECT_DIR / 'config'), 'config'),
    (str(PROJECT_DIR / 'apps'), 'apps'),
    (str(PROJECT_DIR / 'manage.py'), '.'),
    (str(PROJECT_DIR / 'version.txt'), '.'),
]

hiddenimports = [
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'drf_spectacular',
    'django.contrib.admin',
    'django.contrib.admin.apps',
    'django.contrib.admin.models',
    'django.contrib.admin.templatetags',
    'django.contrib.admin.templatetags.admin_list',
    'django.contrib.admin.templatetags.admin_modify',
    'django.contrib.admin.templatetags.admin_urls',
    'django.contrib.auth',
    'django.contrib.auth.templatetags',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.template.context_processors',
    'django.template.defaultfilters',
    'django.template.defaulttags',
    'django.template.loader_tags',
    'PIL',
    'PIL.Image',
    'dateutil',
    'dateutil.parser',
    'webview',
    'webview.platforms.winforms',
    'Python.Runtime',
    'clr',
    'apps.accounts',
    'apps.areas',
    'apps.budget',
    'apps.companies',
    'apps.documents',
    'apps.inventory',
    'apps.invoices',
    'apps.notifications',
    'apps.orders',
    'apps.procurement',
    'apps.quotations',
    'apps.reports',
    'apps.tenants',
    'apps.treasury',
    'updater',
]

excludes = [
    'matplotlib',
    'scipy',
    'pandas',
    'numpy',
    'pytest',
    'unittest.mock',
    'IPython',
    '_pytest',
]

a = Analysis(
    ['desktop_entry.py'],
    pathex=[str(PROJECT_DIR)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='GastosDistribuidos',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='GastosDistribuidos',
)

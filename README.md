# 🏢 Gastos Distribuidos v2

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.13+-blue?logo=python" alt="Python">
  <img src="https://img.shields.io/badge/Django-4.2-green?logo=django" alt="Django">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/Version-0.9.2-orange" alt="Version">
</p>

Sistema multi-tenant para gestión de adquisiciones, compras y distribución de gastos empresariales. Permite a organizaciones gestionar todo el ciclo de compras desde la solicitud de materiales hasta la distribución contable de facturas, incluyendo gestión presupuestal con claves presupuestarias del gobierno mexicano.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Desarrollo Local](#-desarrollo-local)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Roles y Permisos](#-roles-y-permisos)
- [Flujos de Estado](#-flujos-de-estado)
- [API Endpoints](#-api-endpoints)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Documentación](#-documentación)

## ✨ Características

### Gestión de Compras
- **Solicitudes de Material**: Creación y seguimiento de requerimientos por área con ejes rectores, programas presupuestarios y actividades institucionales
- **Catálogo de Productos (COGs)**: Clasificador por Objeto del Gasto del gobierno mexicano con palabras clave para búsqueda
- **Catálogo de Proveedores**: Cada proveedor puede gestionar su propio catálogo de productos con precios
- **Auto-Cotización**: Generación automática de cotizaciones basada en catálogos de proveedores con matching por COG y scoring textual
- **Cotizaciones**: Solicitud, comparación y selección de cotizaciones de proveedores con vista comparativa items × proveedores
- **Órdenes de Compra**: Generación, envío y seguimiento de órdenes con tracking de entregas parciales

### Control Financiero
- **Plantillas Presupuestales**: Gestión de claves presupuestarias con clasificadores completos (unidad ejecutora, COG, fuente de financiamiento, etc.)
- **Autorización Presupuestal**: Flujo de aprobación con solicitudes de autorización (`AUT-YYYY-NNNNN`) y autorizaciones presupuestales
- **Facturas CFDI 4.0**: Carga y procesamiento de comprobantes fiscales digitales (XML/PDF) con extracción automática de datos
- **Distribución de Gastos**: Asignación de costos a áreas con porcentajes personalizables
- **Distribución Rápida**: Flujo simplificado para facturas sin solicitud/orden previa
- **Solicitudes de Gasto**: Control de gastos por área con claves presupuestarias (`SOG-YYYY-NNNNN`)
- **Solicitudes de Pago**: Gestión de pagos bancarios asociados a solicitudes de gasto (`SOP-YYYY-NNNNN`)

### Inventario
- **Recepción de Bienes**: Control de entregas de proveedores con evidencias fotográficas (`REC-YYYY-NNNNN`)
- **Salidas de Almacén**: Registro de entregas a áreas solicitantes con confirmación de recepción (`SAL-YYYY-NNNNN`)
- **Tracking de Entregas**: Control de cantidades recibidas vs ordenadas por línea

### Verificación de Identidad
- **Verificación de INE**: Usuarios que crean solicitudes deben registrar y verificar su INE con un administrador
- **Flujo de Aprobación**: Admin puede aprobar o rechazar INE con motivo de rechazo
- **Re-subida**: Usuarios pueden volver a subir su INE tras rechazo

### Personalización de Usuario
- **Perfiles Personalizables**: Edición de información personal y foto de perfil
- **Avatares**: Subida de fotos de perfil (JPG/PNG/WebP, máx 2MB) con drag & drop
- **Logos Empresariales**: Proveedores y empresas pueden subir sus logos
- **Cambio de Contraseña**: Gestión segura de credenciales

### Portal de Proveedores
- **Dashboard Exclusivo**: Panel con estadísticas y acciones rápidas
- **Catálogo de Productos**: Gestión de productos propios con carga masiva vía CSV
- **Cotizaciones en Línea**: Respuesta a solicitudes de cotización
- **Confirmación de Órdenes**: Aceptación de órdenes de compra
- **Seguimiento de Facturas**: Estado de pagos y documentos
- **Perfil Empresarial**: Logo y datos de contacto personalizables

### Reportes y Analytics
- **Dashboard Ejecutivo**: KPIs y métricas en tiempo real con filtrado por rol
- **Gastos por Área**: Análisis de consumo por centro de costo
- **Tendencias Mensuales**: Gráficos comparativos con Recharts
- **Actividad Reciente**: Historial de acciones del sistema

### Modo Desktop
- **Aplicación Standalone**: Configuración `desktop.py` para ejecutar como aplicación de escritorio con frontend embebido
- **Servido Integrado**: Django sirve el build de React directamente sin necesidad de Vite

## 🛠 Stack Tecnológico

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Python | 3.13+ | Runtime |
| Django | 4.2.x | Framework web |
| Django REST Framework | 3.15+ | API REST |
| PostgreSQL | 15+ | Base de datos (producción) |
| SQLite | 3 | Base de datos (desarrollo/desktop) |
| django-tenants | 3.6+ | Multi-tenancy (producción) |
| SimpleJWT | 5.3+ | Autenticación JWT |
| drf-spectacular | - | Documentación OpenAPI/Swagger |
| Celery | - | Tareas asíncronas (prod) |
| WhiteNoise | - | Static files (dev) |

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18.x | UI Library |
| TypeScript | 5.x | Tipado estático |
| Vite | 5.4+ | Build tool |
| TailwindCSS | 3.4+ | Estilos |
| Zustand | 4.x | State management |
| React Router | 6.x | Routing |
| Recharts | 3.x | Gráficos |
| React Hook Form | 7.x | Formularios |
| React Hot Toast | 2.x | Notificaciones |
| Headless UI | 1.7.x | Componentes accesibles |
| Heroicons | 2.2.x | Iconos |
| Axios | 1.6.x | HTTP client |
| date-fns | 2.x | Manipulación de fechas |

## 📦 Requisitos

### Desarrollo Local
- Python 3.13+
- Node.js 22+
- npm 10+
- Git

### Producción
- Docker & Docker Compose
- PostgreSQL 15+
- Redis (para Celery)
- Nginx (reverse proxy)

### Desktop
- Python 3.13+ con entorno virtual
- Frontend pre-compilado (`npm run build`)

## 🚀 Instalación

### Clonar Repositorio
```bash
git clone https://github.com/tu-usuario/Gastos_Distribuidosv2.git
cd Gastos_Distribuidosv2
```

### Backend
```powershell
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
.\venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements/local.txt       # Desarrollo local (SQLite)
# o
pip install -r requirements/development.txt # Desarrollo con herramientas extra
# o
pip install -r requirements/production.txt  # Producción

# Configurar variables de entorno (si aplica)
cp .env.example .env

# Migraciones (modo local)
$env:DJANGO_SETTINGS_MODULE="config.settings.local"
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver 8000
```

### Frontend
```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 💻 Desarrollo Local

### Configuración Rápida (Windows)
```powershell
# Desde la raíz del proyecto
.\run_all.bat
```

Este script inicia backend y frontend en ventanas separadas automáticamente.

### Configuración Manual

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
$env:DJANGO_SETTINGS_MODULE="config.settings.local"
python manage.py runserver 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Modos de Ejecución

| Modo | Settings | DB | Tenants | Frontend |
|------|----------|----|----|----|
| **Local** | `config.settings.local` | SQLite | Desactivado | Vite dev server |
| **Development** | `config.settings.development` | SQLite | Desactivado | Vite + WhiteNoise |
| **Desktop** | `config.settings.desktop` | SQLite | Desactivado | Django sirve build |
| **Production** | `config.settings.production` | PostgreSQL | Activado | Django sirve build |

### URLs de Desarrollo
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/ |
| Admin Django | http://localhost:8000/admin/ |
| API Docs (Swagger) | http://localhost:8000/api/docs/ |

### Credenciales por Defecto
```
Email: admin@gastos.local
Password: admin123
```

## 📁 Estructura del Proyecto

```
Gastos_Distribuidosv2/
├── backend/
│   ├── apps/
│   │   ├── accounts/        # Usuarios, autenticación, roles, INE
│   │   ├── areas/           # Áreas/departamentos y almacenes
│   │   ├── budget/          # Plantillas presupuestales, claves
│   │   ├── companies/       # Empresas, proveedores, catálogos
│   │   ├── documents/       # Gestión documental
│   │   ├── inventory/       # Entregas (REC), salidas (SAL), evidencias
│   │   ├── invoices/        # Facturas CFDI 4.0, distribución
│   │   ├── notifications/   # Sistema de notificaciones
│   │   ├── orders/          # Órdenes de compra (OC), autorizaciones
│   │   ├── procurement/     # Solicitudes (SOL), COGs, detalles
│   │   ├── quotations/      # Cotizaciones (COT), comparativas
│   │   ├── reports/         # Dashboard, reportes, datos demo
│   │   ├── tenants/         # Multi-tenancy (producción)
│   │   └── treasury/        # Solicitudes de gasto/pago (SOG, SOP)
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py          # Producción con django-tenants
│   │   │   ├── local.py         # SQLite, sin tenants
│   │   │   ├── development.py   # SQLite + WhiteNoise
│   │   │   ├── desktop.py       # App standalone con frontend
│   │   │   └── production.py    # PostgreSQL + tenants
│   │   ├── urls_local.py        # URLs para desarrollo
│   │   ├── urls_desktop.py      # URLs para desktop
│   │   ├── urls.py              # URLs tenant (prod)
│   │   └── urls_public.py       # URLs public schema (prod)
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── local.txt
│   │   ├── development.txt
│   │   ├── desktop.txt
│   │   └── production.txt
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Button, Card, Modal, Table, Input...
│   │   │   └── charts/          # Componentes de gráficos
│   │   ├── layouts/             # MainLayout, AuthLayout
│   │   ├── pages/
│   │   │   ├── admin/           # Users, Áreas, Proveedores, Empresa
│   │   │   ├── auth/            # Login
│   │   │   ├── budget/          # Plantillas, claves presupuestarias
│   │   │   ├── dashboard/       # Dashboard principal
│   │   │   ├── inventory/       # Entregas, salidas de almacén
│   │   │   ├── invoices/        # Facturas, distribución
│   │   │   ├── landing/         # Landing page pública
│   │   │   ├── orders/          # Órdenes de compra
│   │   │   ├── procurement/     # Solicitudes de material
│   │   │   ├── profile/         # Perfil de usuario
│   │   │   ├── proveedor/       # Portal del proveedor (7 páginas)
│   │   │   ├── quotations/      # Cotizaciones, comparativas
│   │   │   └── reportes/        # Reportes y analytics
│   │   ├── services/            # 17 servicios API
│   │   ├── stores/              # Zustand (authStore)
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── docs/                    # Documentación técnica
├── run_all.bat              # Launcher principal
├── CHANGELOG.md             # Historial de cambios
└── README.md
```

## 👥 Roles y Permisos

| Rol | Descripción | Permisos Principales |
|-----|-------------|---------------------|
| **admin** | Administrador del sistema | Acceso total, gestión de usuarios, verificar INE |
| **tesoreria** | Tesorería/Finanzas | Autorización presupuestal, distribución de gastos, facturas, claves presupuestales |
| **adquisiciones** | Área de compras | Gestión de cotizaciones, órdenes, proveedores |
| **almacen** | Almacén/Inventario | Recepción de bienes, salidas de almacén |
| **area** | Jefe de área | Crear solicitudes, ver su área, subir INE |
| **proveedor** | Proveedor externo | Portal exclusivo, cotizar, confirmar órdenes, gestionar catálogo |

### Filtrado de Datos por Rol

El sistema filtra automáticamente la información visible según el rol mediante `get_role_filtered_querysets()`:
- **Admin/Tesorería**: Acceso completo a todos los datos
- **Área**: Solo ve solicitudes de su área
- **Almacén**: Ve órdenes confirmadas para recepción
- **Proveedor**: Solo ve sus propias cotizaciones y órdenes

## 🔄 Flujos de Estado

### SolicitudMaterial
```
PENDIENTE_VERIFICACION → INE_RECHAZADA → BORRADOR → ENVIADO → EN_COTIZACION → COTIZADO → EN_AUTORIZACION → AUTORIZADO → EN_ORDEN → PARCIAL → ENTREGADO | CANCELADO
```

### CotizacionMaterial
```
PENDIENTE → RECIBIDA → SELECCIONADA | RECHAZADA
```

### OrdenCompra
```
BORRADOR → ENVIADA → CONFIRMADA → PARCIAL → ENTREGADA | CANCELADA
```

### Factura
```
PENDIENTE → PROCESANDO → PROCESADA → DISTRIBUIDA | ERROR
```

### SolicitudAutorizacion
```
PENDIENTE → APROBADA | RECHAZADA
```

### SolicitudGasto
```
BORRADOR → ENVIADA → AUTORIZADA | RECHAZADA
```

### SolicitudPago
```
BORRADOR → ENVIADA → PAGADA | RECHAZADA
```

## 🔌 API Endpoints

### Autenticación
```
POST   /api/auth/token/                    # Obtener tokens JWT
POST   /api/auth/token/refresh/            # Refrescar token
POST   /api/auth/register/                 # Registro de usuario
POST   /api/auth/users/upload_ine/         # Subir foto INE
```

### Usuarios y Áreas
```
GET    /api/accounts/users/
GET    /api/areas/
```

### Empresas y Proveedores
```
GET    /api/companies/proveedores/
GET    /api/companies/catalogo-productos/  # Catálogo de productos
POST   /api/companies/catalogo-productos/upload_csv/
```

### COGs y Solicitudes
```
GET    /api/procurement/cogs/
GET    /api/procurement/solicitudes/
POST   /api/procurement/solicitudes/
POST   /api/procurement/solicitudes/{id}/verificar_ine/
POST   /api/procurement/solicitudes/{id}/resubir_ine/
POST   /api/procurement/solicitudes/{id}/buscar_cotizaciones_catalogo/
```

### Cotizaciones
```
GET    /api/quotations/cotizaciones/
GET    /api/quotations/cotizaciones/comparar/{solicitud_id}/
POST   /api/quotations/cotizaciones/{id}/select/
```

### Órdenes de Compra
```
GET    /api/orders/
POST   /api/orders/{id}/send/
POST   /api/orders/{id}/confirm/
```

### Inventario
```
GET    /api/inventory/entregas/
GET    /api/inventory/salidas/
```

### Facturas
```
GET    /api/invoices/facturas/
POST   /api/invoices/upload-and-process/
POST   /api/invoices/facturas/{id}/distribute/
```

### Presupuesto
```
GET    /api/budget/plantillas/
GET    /api/budget/plantillas/{id}/
```

### Tesorería
```
GET    /api/treasury/solicitudes-gasto/
GET    /api/treasury/solicitudes-pago/
```

### Dashboard y Reportes
```
GET    /api/reports/dashboard/stats/
GET    /api/reports/proveedor/dashboard/
GET    /api/reports/gastos-por-area/
GET    /api/reports/gastos-mensuales/
```

## 📦 Módulos del Sistema

### 1. Accounts (`apps/accounts/`)
- Modelo `User` personalizado con roles
- Autenticación JWT con SimpleJWT
- Gestión de avatares y verificación INE
- Permisos: `IsAdmin`, `IsTesoreria`, `IsAdquisiciones`, `IsAlmacen`, `IsArea`, `IsProveedor`

### 2. Areas (`apps/areas/`)
- Modelo `Area` para departamentos/centros de costo
- Filtrado por rol en ViewSets

### 3. Budget (`apps/budget/`)
- `PlantillaPresupuestal`: Agrupa claves por ejercicio fiscal
- `ItemClavePres`: Clave presupuestaria con clasificadores completos
- Integración con COGs y distribución de gastos

### 4. Companies (`apps/companies/`)
- `Company`: Empresas con logo y configuración
- `Proveedor`: Proveedores con logo, RFC, datos de contacto
- `ProductoProveedor`: Catálogo de productos por proveedor

### 5. Procurement (`apps/procurement/`)
- `Cog`: Clasificador por Objeto del Gasto
- `SolicitudMaterial`: Solicitudes con auto-numeración `SOL-YYYY-NNNNN`
- `DetalleMaterial`: Líneas de detalle con COG

### 6. Quotations (`apps/quotations/`)
- `CotizacionMaterial`: Cotizaciones con auto-numeración `COT-YYYY-NNNNN`
- `CotizacionDetalle`: Líneas de cotización
- Servicio de auto-cotización con matching inteligente

### 7. Orders (`apps/orders/`)
- `SolicitudAutorizacion`: Solicitudes de autorización `AUT-YYYY-NNNNN`
- `AutorizacionPresupuestal`: Autorización de tesorería
- `OrdenCompra`: Órdenes con auto-numeración `OC-YYYY-NNNNN`
- `DetalleOrden`: Líneas con tracking de cantidad recibida

### 8. Inventory (`apps/inventory/`)
- `EntregaBienes`: Recepciones `REC-YYYY-NNNNN` con evidencias
- `EntregaDetalle`: Líneas de entrega
- `EvidenciaEntrega`: Fotos de evidencia
- `SalidaBienes`: Salidas `SAL-YYYY-NNNNN` con confirmación
- `SalidaDetalle`: Líneas de salida

### 9. Invoices (`apps/invoices/`)
- `Factura`: Facturas CFDI 4.0 con parsing XML
- `FacturaDetalle`: Conceptos de factura
- `DistribucionGasto`: Distribución a áreas con porcentajes

### 10. Treasury (`apps/treasury/`)
- `SolicitudGasto`: Solicitudes de gasto `SOG-YYYY-NNNNN`
- `ItemSolicitudGasto`: Items por área con clave presupuestaria
- `SolicitudPago`: Solicitudes de pago `SOP-YYYY-NNNNN`
- `ItemSolicitudPago`: Items de pago por área

### 11. Reports (`apps/reports/`)
- Dashboard con filtrado por rol
- Gastos por área, tendencias mensuales
- Portal de proveedor con estadísticas
- Management command `populate_demo_data`

### 12. Documents & Notifications
- `documents`: Gestión documental
- `notifications`: Sistema de notificaciones

## 📚 Documentación

- [CHANGELOG.md](./CHANGELOG.md) - Historial de cambios detallado
- [ROADMAP.md](./ROADMAP.md) - Plan de desarrollo
- [docs/API.md](./docs/API.md) - Documentación de la API
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Guía de despliegue
- [docs/SECURITY_ANALYSIS.md](./docs/SECURITY_ANALYSIS.md) - Análisis de seguridad
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitectura del sistema
- [docs/MANUAL_USUARIO.md](./docs/MANUAL_USUARIO.md) - Manual de usuario
- [docs/DOCUMENTACION_TECNICA.md](./docs/DOCUMENTACION_TECNICA.md) - Documentación técnica

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es software propietario. Todos los derechos reservados.

---

<p align="center">
  Desarrollado con ❤️ para la Agencia MCD
</p>

# 🔧 Documentación Técnica - Gastos Distribuidos v2

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Backend](#3-backend)
4. [Frontend](#4-frontend)
5. [Base de Datos](#5-base-de-datos)
6. [Autenticación y Autorización](#6-autenticación-y-autorización)
7. [APIs y Endpoints](#7-apis-y-endpoints)
8. [Procesamiento CFDI](#8-procesamiento-cfdi)
9. [Seguridad](#9-seguridad)
10. [Despliegue](#10-despliegue)

---

## 1. Arquitectura General

### 1.1 Visión General

El sistema sigue una arquitectura **cliente-servidor** con separación completa entre frontend y backend, comunicándose mediante API RESTful.

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                   React + TypeScript + Vite                     │
│                                                                 │
│   Pages → Components → Services → Zustand Store                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST + JWT
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                │
│                Django + Django REST Framework                   │
│                                                                 │
│   Views → Serializers → Services → Models → PostgreSQL          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Principios Arquitectónicos

- **API First**: Backend expone API RESTful consumida por frontend
- **Stateless**: Autenticación via JWT, sin sesiones en servidor
- **Domain-Driven**: Organización por dominios de negocio (apps Django)
- **Type Safety**: TypeScript en frontend, type hints en Python
- **Multi-tenancy**: Soporte para múltiples organizaciones

---

## 2. Stack Tecnológico

### 2.1 Backend

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| Runtime | Python | 3.13+ | Lenguaje principal |
| Framework | Django | 4.2.x | Framework web |
| API | Django REST Framework | 3.15+ | API REST |
| Autenticación | SimpleJWT | 5.3+ | Tokens JWT |
| Multi-tenancy | django-tenants | 3.6+ | Aislamiento de datos |
| Tareas Async | Celery | 5.x | Procesamiento en background |
| BD Producción | PostgreSQL | 15+ | Base de datos principal |
| BD Desarrollo | SQLite | 3 | Base de datos local |
| Cache | Redis | - | Cache y broker de Celery |

### 2.2 Frontend

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| UI Library | React | 18.x | Framework de interfaz |
| Lenguaje | TypeScript | 5.x | Tipado estático |
| Build Tool | Vite | 5.4+ | Bundler y dev server |
| Estilos | TailwindCSS | 3.4+ | CSS utility-first |
| Estado | Zustand | 4.x | State management |
| Routing | React Router | 6.x | Navegación SPA |
| HTTP | Axios | - | Cliente HTTP |
| Gráficos | Recharts | 2.x | Visualización de datos |
| Notificaciones | React Hot Toast | 2.x | Mensajes al usuario |

---

## 3. Backend

### 3.1 Estructura de Directorios

```
backend/
├── config/                     # Configuración del proyecto
│   ├── settings/
│   │   ├── base.py            # Configuración común
│   │   ├── development.py     # Config desarrollo
│   │   └── production.py      # Config producción
│   ├── urls.py                # URLs principales
│   ├── urls_public.py         # URLs esquema público
│   └── celery.py              # Configuración Celery
│
├── apps/                       # Aplicaciones Django
│   ├── accounts/              # Usuarios y autenticación
│   ├── areas/                 # Áreas/departamentos
│   ├── companies/             # Empresas y proveedores
│   ├── documents/             # Gestión documental
│   ├── inventory/             # Entregas y salidas de almacén
│   ├── invoices/              # Facturas y distribución de gastos
│   ├── notifications/         # Sistema de notificaciones
│   ├── orders/                # Órdenes de compra
│   ├── procurement/           # Solicitudes de material y catálogo COG
│   ├── quotations/            # Cotizaciones
│   ├── reports/               # Dashboard y reportes
│   └── tenants/               # Multi-tenancy
│
├── requirements/               # Dependencias por ambiente
├── media/                      # Archivos subidos
└── manage.py
```

### 3.2 Aplicaciones y Modelos Principales

#### `accounts` - Gestión de Usuarios
```python
class Role(Model):
    """Sistema RBAC con 6 roles predefinidos."""
    class RoleType(TextChoices):
        ADMIN = 'admin'
        TESORERIA = 'tesoreria'
        ADQUISICIONES = 'adquisiciones'
        ALMACEN = 'almacen'
        AREA = 'area'
        PROVEEDOR = 'proveedor'
    
    name: CharField
    permissions: JSONField  # Lista de permisos

class User(AbstractUser):
    email: EmailField  # USERNAME_FIELD
    role: ForeignKey(Role)
    area_assignments: M2M(Area)  # via PersonalArea
```

#### `companies` - Empresas y Proveedores
```python
class Company(Model):
    """Empresa receptora (cliente)."""
    rfc: CharField
    razon_social: CharField
    direccion: campos de dirección

class Proveedor(Model):
    """Proveedor externo."""
    rfc: CharField
    razon_social: CharField
    contacto_email: EmailField
    user: OneToOne(User)  # Acceso al portal
    estado: Choices(PENDIENTE, ACTIVO, SUSPENDIDO)
```

#### `procurement` - Solicitudes de Material
```python
class Cog(Model):
    """Clasificador por Objeto del Gasto (SAT)."""
    codigo: CharField
    descripcion: CharField
    capitulo, concepto, partida_generica, partida_especifica

class SolicitudMaterial(Model):
    """Solicitud de materiales por área."""
    numero: CharField  # Auto-generado: SOL-{año}-{secuencia}
    area: ForeignKey(Area)
    estado: Choices(BORRADOR → ENVIADO → EN_COTIZACION → ...)
    total_estimado: DecimalField
    urgente: BooleanField
    detalles: RelatedManager(DetalleMaterial)

class DetalleMaterial(Model):
    """Ítem de una solicitud."""
    concepto: CharField
    cantidad: DecimalField
    unidad: CharField
    cog: ForeignKey(Cog)
    precio_estimado: DecimalField
```

#### `quotations` - Cotizaciones
```python
class CotizacionMaterial(Model):
    """Cotización de un proveedor."""
    numero: CharField  # COT-{año}-{secuencia}
    solicitud: ForeignKey(SolicitudMaterial)
    proveedor: ForeignKey(Proveedor)
    estado: Choices(PENDIENTE, RECIBIDA, SELECCIONADA, RECHAZADA)
    subtotal, iva, total: DecimalField
    tiempo_entrega: CharField
    condiciones_pago: TextField
```

#### `orders` - Órdenes de Compra
```python
class SolicitudAutorizacion(Model):
    """Solicitud de autorización presupuestal."""
    solicitud: ForeignKey(SolicitudMaterial)
    monto: DecimalField
    estado: Choices(PENDIENTE, APROBADA, RECHAZADA)

class OrdenCompra(Model):
    """Orden de compra al proveedor."""
    numero: CharField  # OC-{año}-{secuencia}
    proveedor: ForeignKey(Proveedor)
    cotizacion: ForeignKey(CotizacionMaterial)
    estado: Choices(BORRADOR → ENVIADA → CONFIRMADA → PARCIAL → ENTREGADA)
    total: DecimalField
    notas_proveedor: TextField  # Para confirmación
```

#### `invoices` - Facturas y Distribución
```python
class Factura(Model):
    """Factura CFDI 4.0."""
    xml_file: FileField
    pdf_file: FileField
    uuid_cfdi: CharField  # UUID del timbre fiscal
    folio, serie: CharField
    rfc_emisor, rfc_receptor: CharField
    subtotal, iva, isr, total: DecimalField
    forma_pago, metodo_pago, uso_cfdi: CharField
    parsed_json: JSONField  # XML parseado completo
    status: Choices(PENDIENTE → PROCESADA → DISTRIBUIDA)

class DistribucionGasto(Model):
    """Distribución del gasto a áreas."""
    factura: ForeignKey(Factura)
    concepto: ForeignKey(FacturaDetalle)
    area: ForeignKey(Area)
    monto: DecimalField
    porcentaje: DecimalField
```

#### `inventory` - Control de Inventario
```python
class EntregaBienes(Model):
    """Recepción de mercancía del proveedor."""
    numero: CharField  # REC-{año}-{secuencia}
    orden: ForeignKey(OrdenCompra)
    factura: ForeignKey(Factura, null=True)
    fecha_recepcion: DateTimeField
    recibido_por: ForeignKey(User)
    completa: BooleanField

class SalidaBienes(Model):
    """Salida de almacén a un área."""
    numero: CharField  # SAL-{año}-{secuencia}
    almacen: ForeignKey(Area)
    destino_area: ForeignKey(Area)
    confirmada: BooleanField
```

### 3.3 Configuración Django

#### Variables de Entorno Críticas
```bash
SECRET_KEY=<clave-secreta-única>
DEBUG=False
ALLOWED_HOSTS=dominio.com
DATABASE_URL=postgres://user:pass@host:5432/db
CORS_ALLOWED_ORIGINS=https://frontend.dominio.com
CELERY_BROKER_URL=redis://localhost:6379/0
JWT_ACCESS_TOKEN_LIFETIME=15  # minutos
JWT_REFRESH_TOKEN_LIFETIME=7  # días
```

#### Apps Instaladas (Tenant-aware)
```python
SHARED_APPS = [
    'django_tenants',
    'apps.tenants',
    'apps.accounts',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
]

TENANT_APPS = [
    'apps.companies',
    'apps.areas',
    'apps.procurement',
    'apps.quotations',
    'apps.orders',
    'apps.inventory',
    'apps.invoices',
    'apps.documents',
    'apps.notifications',
    'apps.reports',
]
```

---

## 4. Frontend

### 4.1 Estructura de Directorios

```
frontend/
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── ui/               # Componentes base (Button, Card, Input, etc.)
│   │   └── charts/           # Componentes de gráficas
│   │
│   ├── layouts/              # Layouts de página
│   │   └── MainLayout.tsx    # Layout con sidebar y header
│   │
│   ├── pages/                # Páginas de la aplicación
│   │   ├── admin/            # Gestión de usuarios, áreas, proveedores
│   │   ├── auth/             # Login
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── inventory/        # Entregas y salidas
│   │   ├── invoices/         # Facturas
│   │   ├── orders/           # Órdenes de compra
│   │   ├── procurement/      # Solicitudes de material
│   │   ├── proveedor/        # Portal del proveedor
│   │   ├── quotations/       # Cotizaciones
│   │   └── reportes/         # Reportes
│   │
│   ├── services/             # Servicios API (Axios)
│   │   ├── api.ts            # Cliente base con interceptors
│   │   ├── authService.ts
│   │   ├── procurementService.ts
│   │   ├── orderService.ts
│   │   ├── facturaService.ts
│   │   └── ...
│   │
│   ├── stores/               # Estado global (Zustand)
│   │   └── authStore.ts      # Estado de autenticación
│   │
│   └── App.tsx               # Router y rutas protegidas
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### 4.2 Servicios API

```typescript
// api.ts - Cliente base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Intentar refresh token
      // Si falla, logout
    }
    return Promise.reject(error);
  }
);
```

### 4.3 Routing y Protección de Rutas

```tsx
// App.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  
  <Route element={<ProtectedRoute allowedRoles={['admin', 'tesoreria', ...]} />}>
    <Route element={<MainLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/solicitudes/*" element={<SolicitudesRoutes />} />
      <Route path="/ordenes/*" element={<OrdenesRoutes />} />
      ...
    </Route>
  </Route>
  
  <Route element={<ProtectedRoute allowedRoles={['proveedor']} />}>
    <Route path="/proveedor/*" element={<ProveedorRoutes />} />
  </Route>
</Routes>
```

---

## 5. Base de Datos

### 5.1 Diagrama de Relaciones

```
                    ┌─────────────┐
                    │    User     │
                    │   (email)   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌───────────┐
        │   Role   │ │ Personal │ │ Proveedor │
        │  (RBAC)  │ │   Area   │ │  Profile  │
        └──────────┘ └─────┬────┘ └───────────┘
                           ▼
                    ┌─────────────┐
                    │    Area     │◄──────────────────────┐
                    │ (presupuesto)                       │
                    └──────┬──────┘                       │
                           │                              │
        ┌──────────────────┼────────────────────┐         │
        ▼                  ▼                    ▼         │
┌───────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  Solicitud    │  │   Distribución  │  │   Salida    │  │
│   Material    │  │      Gasto      │  │   Bienes    │──┘
└───────┬───────┘  └─────────────────┘  └─────────────┘
        │
        ▼
┌───────────────┐
│  Cotización   │
│   Material    │
└───────┬───────┘
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    Orden      │────►│   Entrega     │◄────│   Factura     │
│    Compra     │     │    Bienes     │     │   (CFDI)      │
└───────────────┘     └───────────────┘     └───────────────┘
```

### 5.2 Máquinas de Estados

#### Solicitud de Material
```
BORRADOR → ENVIADO → EN_COTIZACION → COTIZADO → EN_AUTORIZACION 
                                               → AUTORIZADO → EN_ORDEN → PARCIAL → ENTREGADO
                                               → CANCELADO
```

#### Orden de Compra
```
BORRADOR → ENVIADA → CONFIRMADA → PARCIAL → ENTREGADA
                   → CANCELADA
```

#### Factura
```
PENDIENTE → PROCESANDO → PROCESADA → DISTRIBUIDA
          → ERROR
```

---

## 6. Autenticación y Autorización

### 6.1 Flujo JWT

```
┌────────────┐                              ┌────────────┐
│   Cliente  │                              │   Backend  │
└─────┬──────┘                              └──────┬─────┘
      │ POST /api/auth/token/                      │
      │ {email, password}                          │
      │───────────────────────────────────────────►│
      │                                            │
      │ {access, refresh, user}                    │
      │◄───────────────────────────────────────────│
      │                                            │
      │ GET /api/resource/                         │
      │ Authorization: Bearer <access>             │
      │───────────────────────────────────────────►│
      │                                            │
      │ (access expira después de 15 min)          │
      │                                            │
      │ POST /api/auth/token/refresh/              │
      │ {refresh}                                  │
      │───────────────────────────────────────────►│
      │                                            │
      │ {access: nuevo_access_token}               │
      │◄───────────────────────────────────────────│
```

### 6.2 Sistema RBAC

| Permiso | admin | tesoreria | adquisiciones | almacen | area | proveedor |
|---------|:-----:|:---------:|:-------------:|:-------:|:----:|:---------:|
| users.* | ✅ | - | - | - | - | - |
| areas.* | ✅ | R | R | R | R | - |
| procurement.* | ✅ | R | CRU | R | CRU* | - |
| quotations.* | ✅ | R | CRUD | R | R | CRU* |
| orders.* | ✅ | R | CRUD | R | R | R* |
| inventory.* | ✅ | R | R | CRUD | R | - |
| invoices.* | ✅ | CRUD | R | R | R | CR* |
| authorizations.* | ✅ | CRUD | - | - | - | - |

*Solo sus propios datos

### 6.3 Permisos en Código

```python
# Backend - permissions.py
class IsAdminOrTesoreria(BasePermission):
    def has_permission(self, request, view):
        return request.user.role.name in ['admin', 'tesoreria']

# Backend - views.py
class FacturaViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminOrTesoreria]
    
    def get_queryset(self):
        if self.request.user.is_proveedor:
            return Factura.objects.filter(
                proveedor__user=self.request.user
            )
        return Factura.objects.all()
```

---

## 7. APIs y Endpoints

### 7.1 Endpoints Principales

#### Autenticación
```
POST   /api/auth/token/              # Login → {access, refresh}
POST   /api/auth/token/refresh/      # Refresh → {access}
POST   /api/auth/register/           # Registro de usuario
```

#### Usuarios y Áreas
```
GET    /api/accounts/users/          # Lista de usuarios
GET    /api/accounts/me/             # Usuario actual
GET    /api/areas/                   # Lista de áreas
GET    /api/areas/{id}/staff/        # Personal del área
```

#### Proveedores
```
GET    /api/companies/proveedores/   # Lista de proveedores
POST   /api/companies/proveedores/   # Crear proveedor
PATCH  /api/companies/proveedores/{id}/activate/  # Activar
```

#### Solicitudes
```
GET    /api/procurement/solicitudes/          # Lista
POST   /api/procurement/solicitudes/          # Crear
GET    /api/procurement/solicitudes/{id}/     # Detalle
PATCH  /api/procurement/solicitudes/{id}/send/  # Enviar
GET    /api/procurement/cogs/                 # Catálogo COG
```

#### Cotizaciones
```
GET    /api/quotations/cotizaciones/          # Lista
POST   /api/quotations/cotizaciones/          # Crear
POST   /api/quotations/cotizaciones/{id}/select/  # Seleccionar
```

#### Órdenes
```
GET    /api/orders/                           # Lista
POST   /api/orders/                           # Crear
POST   /api/orders/{id}/send/                 # Enviar a proveedor
POST   /api/orders/{id}/confirm/              # Confirmar (proveedor)
```

#### Facturas
```
GET    /api/invoices/facturas/                # Lista
POST   /api/invoices/facturas/                # Subir XML
GET    /api/invoices/facturas/{id}/           # Detalle
POST   /api/invoices/facturas/{id}/distribute/  # Distribuir gasto
```

#### Dashboard
```
GET    /api/reports/dashboard/stats/          # KPIs generales
GET    /api/reports/proveedor/dashboard/      # Dashboard proveedor
GET    /api/reports/gastos-area/              # Gastos por área
```

### 7.2 Formato de Respuesta

```json
// Éxito
{
  "id": 1,
  "numero": "SOL-2026-00001",
  "estado": "enviado",
  "total_estimado": "15000.00",
  "detalles": [...]
}

// Error
{
  "detail": "Mensaje de error",
  "code": "error_code"
}

// Paginación
{
  "count": 100,
  "next": "http://api/resource/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## 8. Procesamiento CFDI

### 8.1 Flujo de Procesamiento

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Upload XML   │────►│  Parse XML    │────►│  Validar      │
│   (Factura)   │     │  (lxml)       │     │  Estructura   │
└───────────────┘     └───────────────┘     └───────┬───────┘
                                                    │
                                                    ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Vincular     │◄────│  Extraer      │◄────│  Buscar       │
│  con Orden    │     │  Datos        │     │  Proveedor    │
└───────┬───────┘     └───────────────┘     │  (por RFC)    │
        │                                   └───────────────┘
        ▼
┌───────────────┐
│  Listo para   │
│  Distribuir   │
└───────────────┘
```

### 8.2 Datos Extraídos del XML

```python
# Campos extraídos automáticamente
factura_data = {
    'uuid_cfdi': '@TFD:UUID',
    'folio': '@Folio',
    'serie': '@Serie',
    'fecha': '@Fecha',
    'rfc_emisor': 'cfdi:Emisor/@Rfc',
    'nombre_emisor': 'cfdi:Emisor/@Nombre',
    'rfc_receptor': 'cfdi:Receptor/@Rfc',
    'subtotal': '@SubTotal',
    'descuento': '@Descuento',
    'total': '@Total',
    'forma_pago': '@FormaPago',
    'metodo_pago': '@MetodoPago',
    'uso_cfdi': 'cfdi:Receptor/@UsoCFDI',
    'tipo_comprobante': '@TipoDeComprobante',
    'moneda': '@Moneda',
    'conceptos': 'cfdi:Conceptos/cfdi:Concepto[]',
    'impuestos': 'cfdi:Impuestos/*',
}
```

---

## 9. Seguridad

### 9.1 Medidas Implementadas

| Capa | Medida | Implementación |
|------|--------|----------------|
| **Autenticación** | JWT con refresh | SimpleJWT, tokens cortos (15min) |
| **Autorización** | RBAC | Roles + permisos por modelo |
| **Comunicación** | HTTPS | Nginx con TLS 1.3 |
| **Contraseñas** | Hash | PBKDF2 (Django default) |
| **Sesiones** | Stateless | No hay cookies de sesión |
| **CORS** | Whitelist | CORS_ALLOWED_ORIGINS |
| **Headers** | Security headers | X-Frame-Options, CSP, etc. |
| **Input** | Validación | Serializers de DRF |
| **SQL** | Parametrizado | Django ORM |
| **Rate Limit** | Throttling | DRF throttle classes |

### 9.2 Headers de Seguridad (Nginx)

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self';" always;
```

### 9.3 Validación de Permisos por Objeto

```python
class FacturaViewSet(ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Factura.objects.all()
        elif user.is_proveedor:
            return Factura.objects.filter(proveedor__user=user)
        elif user.is_area:
            # Solo facturas relacionadas con su área
            return Factura.objects.filter(
                distribuciones__area__in=user.area_assignments.values('area')
            )
        return Factura.objects.none()
```

---

## 10. Despliegue

### 10.1 Arquitectura de Producción

```
                    ┌────────────────┐
                    │    Cloudflare  │
                    │   (CDN + WAF)  │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │     Nginx      │
                    │ (Reverse Proxy)│
                    │ + Rate Limit   │
                    └───────┬────────┘
               ┌────────────┼────────────┐
               ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Gunicorn │ │ Gunicorn │ │  Vite    │
        │ (Backend)│ │ (Backend)│ │ (Static) │
        └────┬─────┘ └────┬─────┘ └──────────┘
             │            │
             └──────┬─────┘
                    ▼
        ┌────────────────────┐
        │    PostgreSQL      │
        │   (Primary + Read  │
        │     Replicas)      │
        └────────────────────┘
                    │
                    ▼
        ┌────────────────────┐
        │       Redis        │
        │ (Cache + Celery)   │
        └────────────────────┘
```

### 10.2 Docker Compose (Desarrollo)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.development
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
    ports:
      - "5173:5173"

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=gastos_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 10.3 Comandos de Desarrollo

```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DJANGO_SETTINGS_MODULE="config.settings.development"
python manage.py migrate
python manage.py runserver 8000

# Frontend
cd frontend
npm install
npm run dev

# Todo junto (Windows)
.\run_all.bat
```

### 10.4 Variables de Entorno Producción

```bash
# Backend (.env)
SECRET_KEY=<generar-clave-segura>
DEBUG=False
ALLOWED_HOSTS=api.dominio.com
DATABASE_URL=postgres://user:pass@db:5432/gastos_db
CORS_ALLOWED_ORIGINS=https://app.dominio.com
CELERY_BROKER_URL=redis://redis:6379/0
USE_S3=True
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_STORAGE_BUCKET_NAME=gastos-media

# Frontend (.env)
VITE_API_URL=https://api.dominio.com/api
```

---

*Versión del documento: 2.0 | Última actualización: Enero 2026*

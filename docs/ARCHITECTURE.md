# 🏗️ Arquitectura del Sistema

Este documento describe la arquitectura técnica de Gastos Distribuidos v2.

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
- [Backend](#backend)
- [Frontend](#frontend)
- [Base de Datos](#base-de-datos)
- [Autenticación y Autorización](#autenticación-y-autorización)
- [Flujos de Datos](#flujos-de-datos)
- [Patrones de Diseño](#patrones-de-diseño)
- [Seguridad](#seguridad)
- [Escalabilidad](#escalabilidad)

---

## Visión General

Gastos Distribuidos v2 es una aplicación web para la gestión de compras y gastos empresariales. Sigue una arquitectura **cliente-servidor** con separación clara entre frontend y backend.

### Principios Arquitectónicos

1. **Separación de Responsabilidades** - Cada módulo tiene una responsabilidad específica
2. **API First** - El backend expone una API RESTful consumida por el frontend
3. **Stateless** - El backend no mantiene estado de sesión (JWT)
4. **Domain-Driven** - Organización por dominios de negocio
5. **Type Safety** - TypeScript en frontend, type hints en Python

---

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    React + TypeScript                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │  Pages  │ │Components│ │ Services│ │   State Mgmt    │ │  │
│  │  │         │ │   UI    │ │  (API)  │ │    (Zustand)    │ │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────────┬────────┘ │  │
│  └───────┼──────────┼───────────┼────────────────┼──────────┘  │
└──────────┼──────────┼───────────┼────────────────┼─────────────┘
           │          │           │                │
           └──────────┴───────────┼────────────────┘
                                  │ HTTPS/REST
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Nginx)                        │
│              Rate Limiting · SSL · Load Balancing               │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Django REST Framework                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │  Views  │ │Serializer│ │ Models │ │    Services     │ │  │
│  │  │  (API)  │ │(Validate)│ │  (ORM) │ │ (Business Logic)│ │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────────┬────────┘ │  │
│  └───────┼──────────┼───────────┼────────────────┼──────────┘  │
└──────────┼──────────┼───────────┼────────────────┼─────────────┘
           │          │           │                │
           └──────────┴───────────┼────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
           ▼                      ▼                      ▼
    ┌────────────┐        ┌────────────┐         ┌────────────┐
    │ PostgreSQL │        │   Redis    │         │   Celery   │
    │  (Primary) │        │  (Cache)   │         │  (Tasks)   │
    └────────────┘        └────────────┘         └────────────┘
```

---

## Backend

### Stack Tecnológico

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Framework | Django 4.2 | Framework web principal |
| API | Django REST Framework | API RESTful |
| Auth | Simple JWT | Autenticación stateless |
| ORM | Django ORM | Acceso a base de datos |
| Task Queue | Celery | Tareas asíncronas |
| Cache | Redis | Caché y sesiones |

### Estructura de Aplicaciones

```
backend/
├── config/                 # Configuración del proyecto
│   ├── settings/
│   │   ├── base.py        # Configuración común
│   │   ├── development.py # Config desarrollo
│   │   └── production.py  # Config producción
│   ├── urls.py            # URLs raíz
│   └── wsgi.py
│
├── apps/                   # Aplicaciones Django
│   ├── users/             # Gestión de usuarios
│   │   ├── models.py      # User, Profile
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── permissions.py
│   │
│   ├── areas/             # Áreas y centros de costo
│   │   ├── models.py      # Area, CentroCosto
│   │   └── ...
│   │
│   ├── proveedores/       # Gestión de proveedores
│   │   ├── models.py      # Proveedor
│   │   └── ...
│   │
│   ├── compras/           # Módulo de compras
│   │   ├── models.py      # Solicitud, SolicitudItem
│   │   ├── services.py    # Lógica de negocio
│   │   └── ...
│   │
│   ├── cotizaciones/      # Cotizaciones
│   │   ├── models.py      # Cotizacion, CotizacionItem
│   │   └── ...
│   │
│   ├── ordenes/           # Órdenes de compra
│   │   ├── models.py      # OrdenCompra, OrdenItem
│   │   └── ...
│   │
│   ├── inventario/        # Inventario
│   │   ├── models.py      # Recepcion, MovimientoStock
│   │   └── ...
│   │
│   ├── pagos/             # Gestión de pagos
│   │   ├── models.py      # Factura, Pago
│   │   └── ...
│   │
│   └── reports/           # Reportes y dashboards
│       ├── views.py       # Dashboard views
│       └── services.py    # Generación de reportes
│
└── utils/                  # Utilidades compartidas
    ├── mixins.py
    └── helpers.py
```

### Capas de la Aplicación

```
┌────────────────────────────────────────────┐
│              Views / ViewSets               │  ← HTTP Request/Response
├────────────────────────────────────────────┤
│              Serializers                    │  ← Validación y serialización
├────────────────────────────────────────────┤
│              Services                       │  ← Lógica de negocio
├────────────────────────────────────────────┤
│              Models                         │  ← ORM / Base de datos
└────────────────────────────────────────────┘
```

---

## Frontend

### Stack Tecnológico

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Framework | React 18 | UI Library |
| Language | TypeScript 5 | Type safety |
| Build | Vite 5 | Bundler rápido |
| Styling | TailwindCSS 3 | Utility-first CSS |
| State | Zustand | Estado global |
| HTTP | Axios | Cliente HTTP |
| Charts | Recharts | Visualización |
| Icons | Lucide React | Iconos |

### Estructura del Frontend

```
frontend/
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── ui/            # Componentes UI base
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   ├── forms/         # Componentes de formulario
│   │   └── common/        # Componentes comunes
│   │
│   ├── pages/             # Páginas/Vistas
│   │   ├── auth/          # Autenticación
│   │   ├── dashboard/     # Dashboard
│   │   ├── solicitudes/   # Gestión de solicitudes
│   │   ├── cotizaciones/  # Cotizaciones
│   │   ├── ordenes/       # Órdenes de compra
│   │   ├── proveedor/     # Portal de proveedores
│   │   └── ...
│   │
│   ├── layouts/           # Layouts
│   │   └── MainLayout.tsx
│   │
│   ├── services/          # Servicios API
│   │   ├── api.ts         # Cliente Axios base
│   │   ├── authService.ts
│   │   ├── solicitudesService.ts
│   │   └── ...
│   │
│   ├── stores/            # Estado global (Zustand)
│   │   └── authStore.ts
│   │
│   ├── types/             # Definiciones TypeScript
│   │   ├── auth.ts
│   │   ├── solicitud.ts
│   │   └── ...
│   │
│   ├── hooks/             # Custom hooks
│   │   └── useAuth.ts
│   │
│   └── utils/             # Utilidades
│       ├── formatters.ts
│       └── validators.ts
│
├── public/                # Archivos estáticos
└── vite.config.ts        # Configuración Vite
```

### Flujo de Componentes

```
App.tsx
├── Router
│   ├── AuthLayout
│   │   ├── LoginPage
│   │   └── RegisterPage
│   │
│   └── MainLayout (Protected)
│       ├── Sidebar
│       │   └── Navigation
│       ├── Header
│       │   └── UserMenu
│       └── Content
│           ├── DashboardPage
│           ├── SolicitudesListPage
│           ├── SolicitudDetailPage
│           └── ...
```

---

## Base de Datos

### Diagrama ER Simplificado

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│   Profile   │     │    Area     │
│             │     └─────────────┘     └──────┬──────┘
└──────┬──────┘                                │
       │                                       │
       │         ┌─────────────────────────────┘
       │         │
       ▼         ▼
┌─────────────────────┐         ┌─────────────┐
│    Solicitud        │────────<│SolicitudItem│
│    - solicitante    │         └─────────────┘
│    - area           │
│    - estado         │
└──────────┬──────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐         ┌─────────────┐
│    Cotizacion       │────────<│CotizacionItem
│    - proveedor      │         └─────────────┘
│    - solicitud      │
└──────────┬──────────┘
           │
           │
           ▼
┌─────────────────────┐         ┌─────────────┐
│    OrdenCompra      │────────<│  OrdenItem  │
│    - cotizacion     │         └─────────────┘
│    - aprobador      │
└──────────┬──────────┘
           │
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐  ┌─────────┐
│Recepcion│  │ Factura │
│         │  │ - pago  │
└─────────┘  └─────────┘
```

### Estados de Entidades

#### Solicitud
```
borrador → enviada → en_cotizacion → cotizada → autorizada → ordenada → recibida → pagada
                                              → rechazada
```

#### Cotización
```
borrador → enviada → seleccionada
                   → rechazada
```

#### Orden de Compra
```
pendiente → confirmada → parcial_recibida → recibida → facturada → pagada
          → cancelada
```

---

## Autenticación y Autorización

### Flujo de Autenticación (JWT)

```
┌────────────┐                          ┌────────────┐
│   Cliente  │                          │   Backend  │
└─────┬──────┘                          └──────┬─────┘
      │                                        │
      │  POST /api/auth/login/                 │
      │  {email, password}                     │
      │───────────────────────────────────────>│
      │                                        │
      │  {access_token, refresh_token, user}   │
      │<───────────────────────────────────────│
      │                                        │
      │  GET /api/solicitudes/                 │
      │  Authorization: Bearer <access_token>  │
      │───────────────────────────────────────>│
      │                                        │
      │  {data: [...]}                         │
      │<───────────────────────────────────────│
      │                                        │
      │  POST /api/auth/refresh/               │
      │  {refresh: refresh_token}              │
      │───────────────────────────────────────>│
      │                                        │
      │  {access: new_access_token}            │
      │<───────────────────────────────────────│
```

### Matriz de Permisos por Rol

| Recurso | admin | tesoreria | adquisiciones | almacen | area | proveedor |
|---------|:-----:|:---------:|:-------------:|:-------:|:----:|:---------:|
| Users | CRUD | R | R | R | - | - |
| Áreas | CRUD | R | R | R | R | - |
| Proveedores | CRUD | R | CRUD | R | R | R* |
| Solicitudes | CRUD | R | CRUD | R | CR | - |
| Cotizaciones | CRUD | R | CRUD | R | R | CRU |
| Órdenes | CRUD | R | CRUD | R | R | R |
| Recepciones | CRUD | R | RU | CRUD | R | - |
| Facturas | CRUD | CRUD | R | R | R | CR |
| Pagos | CRUD | CRUD | R | - | R | R |

*Solo sus propios datos

---

## Flujos de Datos

### Flujo Completo de Compra (Tradicional)

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   Área     │     │Adquisiciones│    │ Proveedor  │
└─────┬──────┘     └──────┬─────┘     └──────┬─────┘
      │                   │                  │
      │ 1. Crear          │                  │
      │ Solicitud         │                  │
      │──────────────────>│                  │
      │                   │                  │
      │                   │ 2. Enviar a      │
      │                   │ cotizar          │
      │                   │─────────────────>│
      │                   │                  │
      │                   │ 3. Recibir       │
      │                   │<─────────────────│
      │                   │ Cotización       │
      │                   │                  │
      │                   │ 4. Seleccionar   │
      │                   │ y crear Orden    │
      │                   │─────────────────>│
```

### Flujo de Auto-Cotización (Basado en Catálogos) ⭐ NUEVO

```
┌────────────┐     ┌────────────┐     ┌───────────────┐    ┌────────────┐
│   Área     │     │Adquisiciones│    │  Auto-Sistema │    │ Proveedor  │
└─────┬──────┘     └──────┬─────┘     └───────┬───────┘    └──────┬─────┘
      │                   │                    │                   │
      │ 1. Crear          │                    │                   │
      │ Solicitud         │                    │                   │
      │──────────────────>│                    │                   │
      │                   │                    │                   │
      │                   │ 2. Clic: "Buscar   │                   │
      │                   │ en Catálogos"      │                   │
      │                   │───────────────────>│                   │
      │                   │                    │                   │
      │                   │                    │ 3. Buscar en      │
      │                   │                    │ catálogos de      │
      │                   │                    │ proveedores       │
      │                   │                    │ (COG + matching)  │
      │                   │                    │                   │
      │                   │                    │ 4. Crear          │
      │                   │<───────────────────┤ cotizaciones      │
      │                   │ Cotizaciones       │ automáticamente   │
      │                   │ automáticas        │                   │
      │                   │                    │                   │
      │                   │ 5. Comparar        │                   │
      │                   │ cotizaciones       │                   │
      │                   │ lado a lado        │                   │
      │                   │                    │                   │
      │                   │ 6. Seleccionar     │                   │
      │                   │ ganador y crear    │                   │
      │                   │ Orden              │                   │
      │                   │────────────────────────────────────────>│
```

**Ventajas del flujo automático:**
- No es necesario enviar cotizaciones por email
- Los precios se obtienen automáticamente del catálogo del proveedor
- Se genera una vista comparativa para elegir la mejor opción
- Más rápido y eficiente
      │                   │                  │
      │                   │                  │ 5. Confirmar
      │                   │<─────────────────│
      │                   │                  │
      │   ┌───────────────┼──────────────────┘
      │   │               │
      │   ▼               ▼
      │  ┌────────────┐  ┌────────────┐
      │  │  Almacén   │  │ Tesorería  │
      │  └─────┬──────┘  └──────┬─────┘
      │        │                │
      │        │ 6. Recibir     │
      │        │ mercancía      │
      │        │                │
      │        │                │ 7. Procesar
      │        │                │ factura y pago
      │        │                │
      └────────┴────────────────┘
```

---

## Patrones de Diseño

### Backend

1. **Repository Pattern** - Abstracción del acceso a datos via Django ORM
2. **Service Layer** - Lógica de negocio separada de views
3. **Serializer Pattern** - Validación y transformación de datos
4. **Decorator Pattern** - Permisos y autenticación

```python
# Ejemplo de Service Layer
class SolicitudService:
    @staticmethod
    def crear_solicitud(user, data):
        """Crea una nueva solicitud con validaciones."""
        if not user.area:
            raise ValidationError("Usuario sin área asignada")
        
        solicitud = Solicitud.objects.create(
            solicitante=user,
            area=user.area,
            **data
        )
        
        # Notificar a adquisiciones
        NotificationService.notify_new_solicitud(solicitud)
        
        return solicitud
```

### Frontend

1. **Container/Presentational** - Separación de lógica y UI
2. **Custom Hooks** - Lógica reutilizable
3. **Compound Components** - Componentes compuestos
4. **Render Props / Children** - Composición flexible

```typescript
// Custom Hook
const useSolicitudes = (filters: SolicitudFilters) => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    solicitudesService.list(filters)
      .then(setSolicitudes)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [filters]);

  return { solicitudes, loading, error };
};
```

---

## Seguridad

### Medidas Implementadas

1. **Autenticación**
   - JWT con refresh tokens
   - Tokens de corta duración (15 min access, 7 días refresh)
   - Logout invalida tokens

2. **Autorización**
   - Permisos basados en roles
   - Validación por objeto (solo ver lo permitido)
   - RBAC + ABAC híbrido

3. **Protección de API**
   - Rate limiting
   - CORS configurado
   - CSRF en Django Admin

4. **Datos**
   - Passwords hasheados (PBKDF2)
   - HTTPS obligatorio
   - Input validation

5. **Headers de Seguridad**
   ```nginx
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   Content-Security-Policy: default-src 'self'
   ```

---

## Escalabilidad

### Horizontal

```
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ Backend 1│ │ Backend 2│ │ Backend 3│
       └────┬─────┘ └────┬─────┘ └────┬─────┘
            │            │            │
            └────────────┼────────────┘
                         │
                         ▼
              ┌────────────────────┐
              │ PostgreSQL Primary │
              │      + Replicas    │
              └────────────────────┘
```

### Caching

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   Client   │────>│   Redis    │────>│  Backend   │
└────────────┘     │   Cache    │     └────────────┘
                   └────────────┘
```

Estrategias:
- Cache de queries frecuentes
- Session cache
- API response cache (con invalidación)

---

## Decisiones Arquitectónicas

### ADR-001: Monolito vs Microservicios
**Decisión**: Monolito modular  
**Razón**: Equipo pequeño, menor complejidad operacional, desarrollo más rápido

### ADR-002: REST vs GraphQL
**Decisión**: REST  
**Razón**: Más simple, mejor documentación, suficiente para el caso de uso

### ADR-003: SPA vs SSR
**Decisión**: SPA (React)  
**Razón**: Mejor experiencia de usuario, separación clara frontend/backend

### ADR-004: State Management
**Decisión**: Zustand  
**Razón**: Simple, poco boilerplate, TypeScript friendly

---

*Última actualización: 24 de enero de 2026*

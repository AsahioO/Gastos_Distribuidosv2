# 🗄️ Esquema de Base de Datos

Este documento describe el modelo de datos de Gastos Distribuidos v2.

## Tabla de Contenidos

- [Diagrama General](#diagrama-general)
- [Módulo de Usuarios](#módulo-de-usuarios)
- [Módulo de Áreas](#módulo-de-áreas)
- [Módulo de Proveedores](#módulo-de-proveedores)
- [Módulo de Compras](#módulo-de-compras)
- [Módulo de Cotizaciones](#módulo-de-cotizaciones)
- [Módulo de Órdenes](#módulo-de-órdenes)
- [Módulo de Inventario](#módulo-de-inventario)
- [Módulo de Pagos](#módulo-de-pagos)
- [Índices y Optimización](#índices-y-optimización)

---

## Diagrama General

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  USUARIOS                                    │
│  ┌────────────┐    ┌─────────────┐                                          │
│  │    User    │───<│   Profile   │                                          │
│  └─────┬──────┘    └─────────────┘                                          │
│        │                                                                     │
└────────┼─────────────────────────────────────────────────────────────────────┘
         │
         │     ┌───────────────────────────────────────────────────────────────┐
         │     │                         ÁREAS                                 │
         │     │  ┌────────────┐    ┌─────────────────┐                        │
         ├────>│  │    Area    │───<│  CentroCosto    │                        │
         │     │  └─────┬──────┘    │    (COG)        │                        │
         │     │        │           └─────────────────┘                        │
         │     └────────┼──────────────────────────────────────────────────────┘
         │              │
         │     ┌────────┼──────────────────────────────────────────────────────┐
         │     │        │              PROVEEDORES                             │
         │     │        │         ┌────────────────┐                           │
         ├─────┼───────>│         │   Proveedor    │                           │
         │     │        │         └───────┬────────┘                           │
         │     │        │                 │                                    │
         │     └────────┼─────────────────┼────────────────────────────────────┘
         │              │                 │
         │     ┌────────┼─────────────────┼────────────────────────────────────┐
         │     │        │                 │           COMPRAS                  │
         │     │        ▼                 │                                    │
         │     │  ┌────────────┐          │     ┌─────────────────┐            │
         └────>│  │ Solicitud  │──────────┼────<│ SolicitudItem   │            │
               │  └─────┬──────┘          │     └─────────────────┘            │
               │        │                 │                                    │
               └────────┼─────────────────┼────────────────────────────────────┘
                        │                 │
               ┌────────┼─────────────────┼────────────────────────────────────┐
               │        ▼                 ▼        COTIZACIONES                │
               │  ┌────────────┐    ┌─────────────────┐                        │
               │  │ Cotizacion │───<│ CotizacionItem  │                        │
               │  └─────┬──────┘    └─────────────────┘                        │
               │        │                                                      │
               └────────┼──────────────────────────────────────────────────────┘
                        │
               ┌────────┼──────────────────────────────────────────────────────┐
               │        ▼                  ÓRDENES                             │
               │  ┌────────────┐    ┌─────────────────┐                        │
               │  │OrdenCompra │───<│   OrdenItem     │                        │
               │  └─────┬──────┘    └─────────────────┘                        │
               │        │                                                      │
               └────────┼──────────────────────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
┌─────────────────┐           ┌─────────────────┐
│   INVENTARIO    │           │     PAGOS       │
│  ┌───────────┐  │           │  ┌───────────┐  │
│  │ Recepcion │  │           │  │  Factura  │  │
│  └─────┬─────┘  │           │  └─────┬─────┘  │
│        │        │           │        │        │
│        ▼        │           │        ▼        │
│  ┌───────────┐  │           │  ┌───────────┐  │
│  │Movimiento │  │           │  │   Pago    │  │
│  │   Stock   │  │           │  └───────────┘  │
│  └───────────┘  │           │                 │
└─────────────────┘           └─────────────────┘
```

---

## Módulo de Usuarios

### User (Extendido)

Extiende `AbstractUser` de Django.

```sql
CREATE TABLE users_user (
    id              BIGSERIAL PRIMARY KEY,
    password        VARCHAR(128) NOT NULL,
    last_login      TIMESTAMP,
    is_superuser    BOOLEAN DEFAULT FALSE,
    username        VARCHAR(150) UNIQUE,
    first_name      VARCHAR(150),
    last_name       VARCHAR(150),
    email           VARCHAR(254) UNIQUE NOT NULL,
    is_staff        BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    date_joined     TIMESTAMP DEFAULT NOW(),
    
    -- Campos personalizados
    role            VARCHAR(20) NOT NULL DEFAULT 'area',
    area_id         BIGINT REFERENCES areas_area(id),
    phone           VARCHAR(20),

    -- Verificación de identidad (INE)
    ine_foto            VARCHAR(255),          -- Ruta del archivo (media/ine/)
    ine_verificada      BOOLEAN DEFAULT FALSE,
    ine_rechazada       BOOLEAN DEFAULT FALSE,
    ine_rechazo_motivo  TEXT DEFAULT '',
    
    CONSTRAINT valid_role CHECK (role IN (
        'admin', 'tesoreria', 'adquisiciones', 
        'almacen', 'area', 'proveedor'
    ))
);

CREATE INDEX idx_users_email ON users_user(email);
CREATE INDEX idx_users_role ON users_user(role);
CREATE INDEX idx_users_area ON users_user(area_id);
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BigInt | Identificador único |
| `email` | String | Email único (usado como username) |
| `role` | Enum | Rol del usuario |
| `area_id` | FK → Area | Área asignada (opcional) |
| `phone` | String | Teléfono de contacto |
| `ine_foto` | ImageField | Foto de INE subida por el usuario |
| `ine_verificada` | Boolean | Si un admin aprobó la INE |
| `ine_rechazada` | Boolean | Si un admin rechazó la INE |
| `ine_rechazo_motivo` | Text | Motivo del rechazo de INE |

### Roles Disponibles

| Rol | Código | Descripción |
|-----|--------|-------------|
| Administrador | `admin` | Acceso total al sistema |
| Tesorería | `tesoreria` | Gestión de pagos y finanzas |
| Adquisiciones | `adquisiciones` | Gestión de compras |
| Almacén | `almacen` | Gestión de inventario |
| Área | `area` | Usuarios de áreas solicitantes |
| Proveedor | `proveedor` | Proveedores externos |

---

## Módulo de Áreas

### Area

```sql
CREATE TABLE areas_area (
    id              BIGSERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    codigo          VARCHAR(20) UNIQUE NOT NULL,
    responsable_id  BIGINT REFERENCES users_user(id),
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_areas_codigo ON areas_area(codigo);
CREATE INDEX idx_areas_activo ON areas_area(activo);
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | String | Nombre del área |
| `codigo` | String | Código único (ej: "ADM", "FIN") |
| `responsable_id` | FK → User | Responsable del área |
| `activo` | Boolean | Estado activo/inactivo |

### CentroCosto (COG)

```sql
CREATE TABLE areas_centrocosto (
    id              BIGSERIAL PRIMARY KEY,
    area_id         BIGINT NOT NULL REFERENCES areas_area(id),
    nombre          VARCHAR(100) NOT NULL,
    codigo          VARCHAR(50) UNIQUE NOT NULL,
    presupuesto     DECIMAL(15,2) DEFAULT 0,
    presupuesto_usado DECIMAL(15,2) DEFAULT 0,
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cog_area ON areas_centrocosto(area_id);
CREATE INDEX idx_cog_codigo ON areas_centrocosto(codigo);
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `area_id` | FK → Area | Área padre |
| `nombre` | String | Nombre del centro de costo |
| `codigo` | String | Código único (ej: "COG-001") |
| `presupuesto` | Decimal | Presupuesto asignado |
| `presupuesto_usado` | Decimal | Presupuesto consumido |

---

## Módulo de Proveedores

### Proveedor

```sql
CREATE TABLE proveedores_proveedor (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT UNIQUE REFERENCES users_user(id),
    
    -- Datos fiscales
    razon_social    VARCHAR(200) NOT NULL,
    rfc             VARCHAR(13) UNIQUE NOT NULL,
    
    -- Contacto
    email           VARCHAR(254) NOT NULL,
    telefono        VARCHAR(20),
    direccion       TEXT,
    ciudad          VARCHAR(100),
    estado          VARCHAR(100),
    codigo_postal   VARCHAR(10),
    
    -- Bancarios
    banco           VARCHAR(100),
    cuenta_bancaria VARCHAR(30),
    clabe           VARCHAR(18),
    
    -- Estado
    activo          BOOLEAN DEFAULT TRUE,
    verificado      BOOLEAN DEFAULT FALSE,
    calificacion    DECIMAL(3,2) DEFAULT 0,
    
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proveedor_rfc ON proveedores_proveedor(rfc);
CREATE INDEX idx_proveedor_user ON proveedores_proveedor(user_id);
CREATE INDEX idx_proveedor_activo ON proveedores_proveedor(activo);
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | FK → User | Usuario asociado (OneToOne) |
| `razon_social` | String | Razón social |
| `rfc` | String(13) | RFC único |
| `banco` | String | Nombre del banco |
| `clabe` | String(18) | CLABE interbancaria |
| `verificado` | Boolean | Si está verificado |
| `calificacion` | Decimal | Calificación promedio (0-5) |

---

## Módulo de Compras

### Solicitud

```sql
CREATE TABLE compras_solicitud (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(20) UNIQUE NOT NULL,  -- SOL-2026-0001
    
    -- Relaciones
    solicitante_id  BIGINT NOT NULL REFERENCES users_user(id),
    area_id         BIGINT NOT NULL REFERENCES areas_area(id),
    cog_id          BIGINT REFERENCES areas_centrocosto(id),
    
    -- Datos
    concepto        VARCHAR(200) NOT NULL,
    justificacion   TEXT,
    fecha_requerida DATE,
    
    -- Estado
    estado          VARCHAR(30) NOT NULL DEFAULT 'borrador',
    prioridad       VARCHAR(10) DEFAULT 'normal',
    
    -- Auditoría
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_estado CHECK (estado IN (
        'pendiente_verificacion', 'ine_rechazada',
        'borrador', 'enviada', 'en_cotizacion', 'cotizada',
        'autorizada', 'rechazada', 'ordenada', 'recibida', 'pagada'
    )),
    CONSTRAINT valid_prioridad CHECK (prioridad IN (
        'baja', 'normal', 'alta', 'urgente'
    ))
);

CREATE INDEX idx_solicitud_numero ON compras_solicitud(numero);
CREATE INDEX idx_solicitud_estado ON compras_solicitud(estado);
CREATE INDEX idx_solicitud_solicitante ON compras_solicitud(solicitante_id);
CREATE INDEX idx_solicitud_area ON compras_solicitud(area_id);
CREATE INDEX idx_solicitud_fecha ON compras_solicitud(created_at);
```

#### Estados de Solicitud

```
[sin INE] ──subir INE──> pendiente_verificacion ──aprobar──> borrador ─────> enviada ─────> en_cotizacion ─────> cotizada
                                 │                                                                                    │
                         rechazar│                                                                                    ▼
                                 ▼                                                              ┌─────── autorizada ──────┐
                          ine_rechazada                                                         │                        │
                         (usuario resubir)                                                      ▼                        ▼
                                                                                          rechazada              ordenada ─> recibida ─> pagada
```

### SolicitudItem

```sql
CREATE TABLE compras_solicituditem (
    id              BIGSERIAL PRIMARY KEY,
    solicitud_id    BIGINT NOT NULL REFERENCES compras_solicitud(id) ON DELETE CASCADE,
    
    descripcion     VARCHAR(500) NOT NULL,
    cantidad        DECIMAL(10,2) NOT NULL,
    unidad          VARCHAR(50) DEFAULT 'pza',
    especificaciones TEXT,
    
    -- Opcional: precio estimado
    precio_estimado DECIMAL(15,2),
    
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_solicituditem_solicitud ON compras_solicituditem(solicitud_id);
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `solicitud_id` | FK → Solicitud | Solicitud padre |
| `descripcion` | String | Descripción del artículo |
| `cantidad` | Decimal | Cantidad requerida |
| `unidad` | String | Unidad de medida |
| `especificaciones` | Text | Especificaciones técnicas |

---

## Módulo de Cotizaciones

### Cotizacion

```sql
CREATE TABLE cotizaciones_cotizacion (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(20) UNIQUE NOT NULL,  -- COT-2026-0001
    
    -- Relaciones
    solicitud_id    BIGINT NOT NULL REFERENCES compras_solicitud(id),
    proveedor_id    BIGINT NOT NULL REFERENCES proveedores_proveedor(id),
    
    -- Montos
    subtotal        DECIMAL(15,2) NOT NULL DEFAULT 0,
    iva             DECIMAL(15,2) NOT NULL DEFAULT 0,
    total           DECIMAL(15,2) NOT NULL DEFAULT 0,
    moneda          VARCHAR(3) DEFAULT 'MXN',
    
    -- Condiciones
    tiempo_entrega  INTEGER,  -- días
    vigencia        DATE,
    condiciones_pago VARCHAR(100),
    notas           TEXT,
    
    -- Estado
    estado          VARCHAR(20) NOT NULL DEFAULT 'borrador',
    
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_estado CHECK (estado IN (
        'borrador', 'enviada', 'seleccionada', 'rechazada'
    ))
);

CREATE INDEX idx_cotizacion_numero ON cotizaciones_cotizacion(numero);
CREATE INDEX idx_cotizacion_solicitud ON cotizaciones_cotizacion(solicitud_id);
CREATE INDEX idx_cotizacion_proveedor ON cotizaciones_cotizacion(proveedor_id);
CREATE INDEX idx_cotizacion_estado ON cotizaciones_cotizacion(estado);
```

### CotizacionItem

```sql
CREATE TABLE cotizaciones_cotizacionitem (
    id                  BIGSERIAL PRIMARY KEY,
    cotizacion_id       BIGINT NOT NULL REFERENCES cotizaciones_cotizacion(id) ON DELETE CASCADE,
    solicitud_item_id   BIGINT REFERENCES compras_solicituditem(id),
    
    descripcion         VARCHAR(500) NOT NULL,
    cantidad            DECIMAL(10,2) NOT NULL,
    unidad              VARCHAR(50) DEFAULT 'pza',
    precio_unitario     DECIMAL(15,2) NOT NULL,
    subtotal            DECIMAL(15,2) NOT NULL,
    
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cotizacionitem_cotizacion ON cotizaciones_cotizacionitem(cotizacion_id);
```

---

## Módulo de Órdenes

### OrdenCompra

```sql
CREATE TABLE ordenes_ordencompra (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(20) UNIQUE NOT NULL,  -- OC-2026-0001
    
    -- Relaciones
    cotizacion_id   BIGINT NOT NULL REFERENCES cotizaciones_cotizacion(id),
    proveedor_id    BIGINT NOT NULL REFERENCES proveedores_proveedor(id),
    aprobador_id    BIGINT REFERENCES users_user(id),
    
    -- Montos
    subtotal        DECIMAL(15,2) NOT NULL,
    iva             DECIMAL(15,2) NOT NULL,
    total           DECIMAL(15,2) NOT NULL,
    moneda          VARCHAR(3) DEFAULT 'MXN',
    
    -- Fechas
    fecha_emision   DATE DEFAULT CURRENT_DATE,
    fecha_entrega   DATE,
    
    -- Estado
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    confirmada_proveedor BOOLEAN DEFAULT FALSE,
    fecha_confirmacion TIMESTAMP,
    
    -- Notas
    notas           TEXT,
    
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_estado CHECK (estado IN (
        'pendiente', 'confirmada', 'parcial_recibida',
        'recibida', 'facturada', 'pagada', 'cancelada'
    ))
);

CREATE INDEX idx_orden_numero ON ordenes_ordencompra(numero);
CREATE INDEX idx_orden_cotizacion ON ordenes_ordencompra(cotizacion_id);
CREATE INDEX idx_orden_proveedor ON ordenes_ordencompra(proveedor_id);
CREATE INDEX idx_orden_estado ON ordenes_ordencompra(estado);
CREATE INDEX idx_orden_fecha ON ordenes_ordencompra(fecha_emision);
```

### OrdenItem

```sql
CREATE TABLE ordenes_ordenitem (
    id                  BIGSERIAL PRIMARY KEY,
    orden_id            BIGINT NOT NULL REFERENCES ordenes_ordencompra(id) ON DELETE CASCADE,
    cotizacion_item_id  BIGINT REFERENCES cotizaciones_cotizacionitem(id),
    
    descripcion         VARCHAR(500) NOT NULL,
    cantidad            DECIMAL(10,2) NOT NULL,
    cantidad_recibida   DECIMAL(10,2) DEFAULT 0,
    unidad              VARCHAR(50) DEFAULT 'pza',
    precio_unitario     DECIMAL(15,2) NOT NULL,
    subtotal            DECIMAL(15,2) NOT NULL,
    
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ordenitem_orden ON ordenes_ordenitem(orden_id);
```

---

## Módulo de Inventario

### Recepcion

```sql
CREATE TABLE inventario_recepcion (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(20) UNIQUE NOT NULL,  -- REC-2026-0001
    
    -- Relaciones
    orden_id        BIGINT NOT NULL REFERENCES ordenes_ordencompra(id),
    recibido_por_id BIGINT NOT NULL REFERENCES users_user(id),
    
    -- Datos
    fecha_recepcion DATE DEFAULT CURRENT_DATE,
    tipo            VARCHAR(20) DEFAULT 'total',  -- total, parcial
    notas           TEXT,
    
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recepcion_orden ON inventario_recepcion(orden_id);
CREATE INDEX idx_recepcion_fecha ON inventario_recepcion(fecha_recepcion);
```

### RecepcionItem

```sql
CREATE TABLE inventario_recepcionitem (
    id              BIGSERIAL PRIMARY KEY,
    recepcion_id    BIGINT NOT NULL REFERENCES inventario_recepcion(id) ON DELETE CASCADE,
    orden_item_id   BIGINT NOT NULL REFERENCES ordenes_ordenitem(id),
    
    cantidad_recibida DECIMAL(10,2) NOT NULL,
    estado          VARCHAR(20) DEFAULT 'correcto',  -- correcto, dañado, faltante
    notas           TEXT,
    
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recepcionitem_recepcion ON inventario_recepcionitem(recepcion_id);
```

---

## Módulo de Pagos

### Factura

```sql
CREATE TABLE pagos_factura (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(50) NOT NULL,
    uuid_fiscal     VARCHAR(36) UNIQUE,  -- UUID del CFDI
    
    -- Relaciones
    orden_id        BIGINT NOT NULL REFERENCES ordenes_ordencompra(id),
    proveedor_id    BIGINT NOT NULL REFERENCES proveedores_proveedor(id),
    
    -- Montos
    subtotal        DECIMAL(15,2) NOT NULL,
    iva             DECIMAL(15,2) NOT NULL,
    total           DECIMAL(15,2) NOT NULL,
    moneda          VARCHAR(3) DEFAULT 'MXN',
    
    -- Fechas
    fecha_emision   DATE NOT NULL,
    fecha_vencimiento DATE,
    
    -- Estado
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    
    -- Archivos
    archivo_xml     VARCHAR(255),
    archivo_pdf     VARCHAR(255),
    
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_estado CHECK (estado IN (
        'pendiente', 'aprobada', 'programada', 'pagada', 'cancelada'
    ))
);

CREATE INDEX idx_factura_uuid ON pagos_factura(uuid_fiscal);
CREATE INDEX idx_factura_orden ON pagos_factura(orden_id);
CREATE INDEX idx_factura_proveedor ON pagos_factura(proveedor_id);
CREATE INDEX idx_factura_estado ON pagos_factura(estado);
CREATE INDEX idx_factura_vencimiento ON pagos_factura(fecha_vencimiento);
```

### Pago

```sql
CREATE TABLE pagos_pago (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(20) UNIQUE NOT NULL,  -- PAG-2026-0001
    
    -- Relaciones
    factura_id      BIGINT NOT NULL REFERENCES pagos_factura(id),
    realizado_por_id BIGINT NOT NULL REFERENCES users_user(id),
    
    -- Monto
    monto           DECIMAL(15,2) NOT NULL,
    moneda          VARCHAR(3) DEFAULT 'MXN',
    
    -- Método
    metodo_pago     VARCHAR(50) NOT NULL,
    referencia      VARCHAR(100),
    
    -- Fecha
    fecha_pago      DATE DEFAULT CURRENT_DATE,
    
    -- Comprobante
    comprobante     VARCHAR(255),
    notas           TEXT,
    
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pago_factura ON pagos_pago(factura_id);
CREATE INDEX idx_pago_fecha ON pagos_pago(fecha_pago);
```

---

## Índices y Optimización

### Índices Recomendados para Consultas Frecuentes

```sql
-- Solicitudes por estado y fecha (Dashboard)
CREATE INDEX idx_solicitud_estado_fecha 
ON compras_solicitud(estado, created_at DESC);

-- Órdenes pendientes de pago
CREATE INDEX idx_orden_pago_pendiente 
ON ordenes_ordencompra(estado, proveedor_id) 
WHERE estado IN ('recibida', 'facturada');

-- Facturas por vencer
CREATE INDEX idx_factura_vencimiento_estado 
ON pagos_factura(fecha_vencimiento, estado) 
WHERE estado = 'pendiente';

-- Búsqueda full-text en proveedores
CREATE INDEX idx_proveedor_search 
ON proveedores_proveedor 
USING gin(to_tsvector('spanish', razon_social || ' ' || rfc));
```

### Optimización de Queries

```sql
-- Query de dashboard con agregaciones
EXPLAIN ANALYZE
SELECT 
    estado,
    COUNT(*) as total,
    SUM(total) as monto_total
FROM ordenes_ordencompra
WHERE fecha_emision >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY estado;
```

---

## Migraciones

### Comandos Django

```bash
# Crear migración
python manage.py makemigrations <app_name>

# Ver SQL de migración
python manage.py sqlmigrate <app_name> <migration_number>

# Aplicar migraciones
python manage.py migrate

# Ver estado de migraciones
python manage.py showmigrations
```

### Backup y Restore

```bash
# Backup
pg_dump -h localhost -U gastos_user -d gastos_db -F c -f backup.dump

# Restore
pg_restore -h localhost -U gastos_user -d gastos_db -c backup.dump
```

---

*Última actualización: 24 de enero de 2026*

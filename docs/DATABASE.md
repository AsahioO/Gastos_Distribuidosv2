# 🗄️ Esquema de Base de Datos — Gastos Distribuidos v2

Modelo de datos completo: 38 entidades en 13 aplicaciones Django.
Arquitectura multi-tenant con **django-tenants** (esquema por tenant en PostgreSQL 15+).

---

## Tabla de Contenidos

- [Vista General por Módulos](#vista-general-por-módulos)
- [1. Núcleo: Usuarios, Roles y Multi-tenancy](#1-núcleo-usuarios-roles-y-multi-tenancy)
- [2. Organización: Compañías, Áreas y Proveedores](#2-organización-compañías-áreas-y-proveedores)
- [3. Flujo de Procuración](#3-flujo-de-procuración)
- [4. Inventario y Distribución](#4-inventario-y-distribución)
- [5. Facturación CFDI 4.0](#5-facturación-cfdi-40)
- [6. Tesorería y Presupuestos](#6-tesorería-y-presupuestos)
- [7. Documentos, Media y Auditoría](#7-documentos-media-y-auditoría)
- [8. Catálogo COG](#8-catálogo-cog)
- [Índices y Optimización](#índices-y-optimización)
- [Migraciones y Backup](#migraciones-y-backup)

---

## Vista General por Módulos

```mermaid
flowchart TB
    subgraph core["🔐 accounts · tenants"]
        Role[Role]
        User[User]
        Tenant[Tenant]
        Domain[Domain]
        SolGub[SolicitudGubernamental]
        Role -->|"role_id"| User
        Tenant -->|"tenant_id"| Domain
    end

    subgraph org["🏢 companies · areas"]
        Company[Company]
        Proveedor[Proveedor]
        ProdProv[ProductoProveedor]
        Firmante[FirmanteDocumento]
        Area[Area]
        PerArea[PersonalArea]
        User -->|"user_id"| Proveedor
        Proveedor -->|"proveedor_id"| ProdProv
        Company -->|"company_id"| Area
        Company -->|"company_id"| Firmante
        Area -->|"parent_id"| Area
        User -->|"user_id"| PerArea
        Area -->|"area_id"| PerArea
    end

    subgraph proc["📋 procurement · quotations · orders"]
        Cog[Cog]
        SolMat[SolicitudMaterial]
        DetMat[DetalleMaterial]
        CotMat[CotizacionMaterial]
        CotDet[CotizacionDetalle]
        SolAut[SolicitudAutorizacion]
        AutPres[AutorizacionPresupuestal]
        OrdCom[OrdenCompra]
        DetOrd[DetalleOrden]
        Area -->|"area_id"| SolMat
        SolMat -->|"solicitud_id"| DetMat
        Cog -->|"cog_id"| DetMat
        SolMat -->|"solicitud_id"| CotMat
        Proveedor -->|"proveedor_id"| CotMat
        CotMat -->|"cotizacion_id"| CotDet
        SolMat -->|"solicitud_id"| SolAut
        SolAut -->|"1:1"| AutPres
        CotMat -->|"cotizacion_id"| OrdCom
        AutPres -->|"autorizacion_id"| OrdCom
        Proveedor -->|"proveedor_id"| OrdCom
        OrdCom -->|"orden_id"| DetOrd
    end

    subgraph inv["📦 inventory"]
        EntBien[EntregaBienes]
        EntDet[EntregaDetalle]
        EvEnt[EvidenciaEntrega]
        SalBien[SalidaBienes]
        SalDet[SalidaDetalle]
        OrdCom -->|"orden_id"| EntBien
        EntBien -->|"entrega_id"| EntDet
        EntBien -->|"entrega_id"| EvEnt
        DetOrd -->|"detalle_orden_id"| EntDet
        Area -->|"almacen_id"| SalBien
        Area -->|"destino_area_id"| SalBien
        SalBien -->|"salida_id"| SalDet
    end

    subgraph cfd["🧾 invoices"]
        Factura[Factura]
        FacDet[FacturaDetalle]
        DistGasto[DistribucionGasto]
        Proveedor -->|"proveedor_id"| Factura
        Factura -->|"factura_id"| FacDet
        Factura -->|"factura_id"| DistGasto
        FacDet -->|"concepto_id"| DistGasto
        Area -->|"area_id"| DistGasto
        EntBien -->|"factura_id"| Factura
    end

    subgraph tes["💰 treasury · budget"]
        SolGas[SolicitudGasto]
        ItemSG[ItemSolicitudGasto]
        SolPag[SolicitudPago]
        ItemSP[ItemSolicitudPago]
        PlanPre[PlantillaPresupuestal]
        ItemCP[ItemClavePres]
        Factura -->|"factura_id"| SolGas
        SolGas -->|"1:1"| SolPag
        SolGas -->|"solicitud_gasto_id"| ItemSG
        SolPag -->|"solicitud_pago_id"| ItemSP
        Tenant -->|"tenant_id"| PlanPre
        PlanPre -->|"plantilla_id"| ItemCP
    end

    subgraph aux["📎 documents · notifications"]
        PDF[PDFDocument]
        Media[Media]
        Notif[Notification]
        ActLog[ActivityLog]
        User -->|"user_id"| Notif
        User -->|"user_id"| ActLog
    end

    %% cross-module connections
    User -->|"created_by_id"| SolMat
    User -->|"uploaded_by_id"| Factura
    User -->|"solicitante_id"| SolGas
    User -->|"created_by_id"| OrdCom
    SolMat -->|"solicitud_id"| DistGasto

    style core fill:#e3f2fd,stroke:#1976d2,color:#000
    style org fill:#e8f5e9,stroke:#388e3c,color:#000
    style proc fill:#fff3e0,stroke:#f57c00,color:#000
    style inv fill:#fce4ec,stroke:#c2185b,color:#000
    style cfd fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style tes fill:#e0f2f1,stroke:#00796b,color:#000
    style aux fill:#eceff1,stroke:#546e7a,color:#000
```

### Resumen de Apps y Entidades

| App Django | # | Entidades |
|------------|---|-----------|
| **accounts** | 2 | Role, User |
| **tenants** | 3 | Tenant, Domain, SolicitudGubernamental |
| **companies** | 4 | Company, Proveedor, ProductoProveedor, FirmanteDocumento |
| **areas** | 2 | Area, PersonalArea |
| **procurement** | 3 | Cog, SolicitudMaterial, DetalleMaterial |
| **quotations** | 2 | CotizacionMaterial, CotizacionDetalle |
| **orders** | 4 | SolicitudAutorizacion, AutorizacionPresupuestal, OrdenCompra, DetalleOrden |
| **inventory** | 5 | EntregaBienes, EntregaDetalle, EvidenciaEntrega, SalidaBienes, SalidaDetalle |
| **invoices** | 3 | Factura, FacturaDetalle, DistribucionGasto |
| **treasury** | 4 | SolicitudGasto, ItemSolicitudGasto, SolicitudPago, ItemSolicitudPago |
| **budget** | 2 | PlantillaPresupuestal, ItemClavePres |
| **documents** | 2 | PDFDocument, Media |
| **notifications** | 2 | Notification, ActivityLog |
| **Total** | **38** | |

---

## 1. Núcleo: Usuarios, Roles y Multi-tenancy

```mermaid
erDiagram
    Role ||--o{ User : "role_id"
    Tenant ||--o{ Domain : "tenant_id"
    Tenant ||--o| SolicitudGubernamental : "tenant_id"
    User ||--o| SolicitudGubernamental : "reviewed_by_id"

    Role {
        bigint id PK
        varchar name UK "admin|tesoreria|adquisiciones|almacen|area|proveedor"
        json permissions "lista de strings"
        boolean is_active
    }

    User {
        bigint id PK
        varchar email UK "username"
        varchar full_name
        varchar phone
        bigint role_id FK
        varchar avatar "upload_to='avatars/'"
        boolean ine_verificada
        boolean ine_rechazada
        text ine_rechazo_motivo
        varchar last_login_ip
        json settings
    }

    Tenant {
        bigint id PK
        varchar schema_name UK "esquema PostgreSQL"
        varchar name "organización"
        varchar rfc
        boolean is_active
        json settings
    }

    Domain {
        bigint id PK
        varchar domain UK
        bigint tenant_id FK
        boolean is_primary
    }

    SolicitudGubernamental {
        bigint id PK
        varchar nombre_solicitante
        varchar email_solicitante
        varchar nombre_organizacion
        varchar rfc
        varchar estado "pendiente|aprobada|rechazada"
        bigint reviewed_by_id FK
        text rejection_reason
        bigint tenant_id FK "OneToOne al aprobar"
    }
```

### User

Extiende `AbstractUser`. Usa `email` como `USERNAME_FIELD`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BigAutoField PK | |
| `email` | EmailField UNIQUE | Username |
| `full_name` | CharField(255) | |
| `phone` | CharField(20) | |
| `role` | FK → Role PROTECT | Control de acceso |
| `avatar` | ImageField | |
| `ine_foto` | ImageField | Verificación de identidad |
| `ine_verificada` | BooleanField | |
| `ine_rechazada` | BooleanField | |
| `ine_rechazo_motivo` | TextField | |
| `last_login_ip` | GenericIPAddressField | |
| `settings` | JSONField | default: {} |

### Role

| Campo | Tipo |
|-------|------|
| `name` | `admin` / `tesoreria` / `adquisiciones` / `almacen` / `area` / `proveedor` |
| `permissions` | JSONField (lista de strings) |

### Tenant

Arquitectura **schema-per-tenant**. El esquema `public` contiene Tenant, Domain y SolicitudGubernamental. Cada tenant tiene su propio esquema PostgreSQL con todas las demás tablas replicadas.

---

## 2. Organización: Compañías, Áreas y Proveedores

```mermaid
erDiagram
    Company ||--o{ Area : "company_id"
    Company ||--o{ FirmanteDocumento : "company_id"
    Area ||--o| Area : "parent_id (self-ref)"
    Area ||--o{ PersonalArea : "area_id"
    User ||--o{ PersonalArea : "user_id"
    User ||--o| Proveedor : "user_id (OneToOne)"
    User ||--o{ FirmanteDocumento : "user_id"
    Proveedor ||--o{ ProductoProveedor : "proveedor_id"
    Cog ||--o{ ProductoProveedor : "cog_id"

    Company {
        bigint id PK
        varchar rfc UK
        varchar razon_social
        varchar nombre_comercial
        varchar calle
        varchar codigo_postal
        varchar telefono
        varchar email
        boolean is_active
    }

    Proveedor {
        bigint id PK
        varchar rfc UK
        varchar razon_social
        varchar nombre_comercial
        varchar contacto_nombre
        varchar contacto_email "requerido"
        varchar contacto_telefono
        text direccion
        varchar estado "pendiente|activo|suspendido"
        bigint user_id FK "OneToOne"
        json documentos
    }

    ProductoProveedor {
        bigint id PK
        bigint proveedor_id FK
        bigint cog_id FK
        varchar nombre "500 chars"
        text descripcion
        varchar unidad
        decimal precio_unitario "15,2"
        varchar marca
        varchar modelo
        boolean is_active
    }

    FirmanteDocumento {
        bigint id PK
        bigint company_id FK
        varchar tipo_documento "solicitud|cotizacion|orden_compra|etc."
        varchar cargo
        varchar nombre
        bigint user_id FK
        integer orden
    }

    Area {
        bigint id PK
        bigint company_id FK
        varchar name
        varchar code UK "por company"
        text description
        bigint parent_id FK "self-ref jerarquía"
        bigint manager_id FK
        decimal presupuesto_anual "15,2"
        boolean is_active
    }

    PersonalArea {
        bigint id PK
        bigint user_id FK
        bigint area_id FK
        varchar cargo
        boolean is_primary
    }
```

### Restricciones de Unicidad

| Tabla | Constraint |
|-------|-----------|
| Proveedor | `rfc` UNIQUE, `user_id` UNIQUE |
| ProductoProveedor | `(proveedor, nombre, unidad)` UNIQUE |
| FirmanteDocumento | `(company, tipo_documento, orden)` UNIQUE |
| Area | `(company, code)` UNIQUE |
| PersonalArea | `(user, area)` UNIQUE |

---

## 3. Flujo de Procuración

```mermaid
erDiagram
    Area ||--o{ SolicitudMaterial : "area_id"
    SolicitudMaterial ||--o{ DetalleMaterial : "solicitud_id"
    DetalleMaterial }o--|| Cog : "cog_id"
    SolicitudMaterial ||--o{ CotizacionMaterial : "solicitud_id"
    Proveedor ||--o{ CotizacionMaterial : "proveedor_id"
    CotizacionMaterial ||--o{ CotizacionDetalle : "cotizacion_id"
    DetalleMaterial ||--o{ CotizacionDetalle : "detalle_material_id (opc)"
    SolicitudMaterial ||--o{ SolicitudAutorizacion : "solicitud_id"
    CotizacionMaterial ||--o{ SolicitudAutorizacion : "cotizacion_id (opc)"
    SolicitudAutorizacion ||--|| AutorizacionPresupuestal : "solicitud_autorizacion_id"
    Proveedor ||--o{ OrdenCompra : "proveedor_id"
    AutorizacionPresupuestal ||--o{ OrdenCompra : "autorizacion_id (opc)"
    CotizacionMaterial ||--o{ OrdenCompra : "cotizacion_id (opc)"
    OrdenCompra ||--o{ DetalleOrden : "orden_id"
    DetalleMaterial ||--o{ DetalleOrden : "detalle_material_id (opc)"

    SolicitudMaterial {
        bigint id PK
        varchar numero UK "SOL-YYYY-NNNNN"
        bigint area_id FK
        date fecha_solicitud
        text justificacion
        varchar estado "13 estados"
        decimal total_estimado "15,2"
        boolean urgente
        bigint created_by_id FK
    }

    DetalleMaterial {
        bigint id PK
        bigint solicitud_id FK
        varchar concepto "500 chars"
        decimal cantidad "15,4"
        varchar unidad
        bigint cog_id FK
        decimal precio_estimado "15,2"
    }

    CotizacionMaterial {
        bigint id PK
        varchar numero UK "COT-YYYY-NNNNN"
        bigint solicitud_id FK
        bigint proveedor_id FK
        decimal subtotal "15,2"
        decimal iva "15,2"
        decimal total "15,2"
        varchar tiempo_entrega
        text condiciones_pago
        varchar estado "pendiente|recibida|seleccionada|rechazada"
        varchar documento "PDF"
    }

    CotizacionDetalle {
        bigint id PK
        bigint cotizacion_id FK
        bigint detalle_material_id FK "opc"
        varchar concepto
        decimal cantidad "15,4"
        varchar unidad
        decimal precio_unitario "15,2"
        decimal subtotal "15,2"
    }

    SolicitudAutorizacion {
        bigint id PK
        varchar numero UK "AUT-YYYY-NNNNN"
        bigint solicitud_id FK
        bigint cotizacion_id FK "opc"
        decimal monto_solicitado "15,2"
        varchar estado "pendiente|aprobada|rechazada"
        bigint solicitante_id FK
    }

    AutorizacionPresupuestal {
        bigint id PK
        bigint solicitud_autorizacion_id FK "OneToOne"
        decimal monto_autorizado "15,2"
        varchar partida_presupuestal
        date fecha_aprobacion
        bigint aprobado_por_id FK
    }

    OrdenCompra {
        bigint id PK
        varchar numero UK "OC-YYYY-NNNNN"
        bigint proveedor_id FK
        bigint autorizacion_id FK "opc"
        bigint cotizacion_id FK "opc"
        decimal subtotal "15,2"
        decimal iva "15,2"
        decimal total "15,2"
        varchar estado "borrador|enviada|confirmada|parcial|entregada|cancelada"
        bigint created_by_id FK
    }

    DetalleOrden {
        bigint id PK
        bigint orden_id FK
        bigint detalle_material_id FK "opc"
        varchar concepto
        decimal cantidad "15,4"
        varchar unidad
        decimal precio_unitario "15,2"
        decimal subtotal "15,2"
        decimal cantidad_recibida "15,4"
    }
```

### Numeración de Documentos

| Documento | Prefijo | Formato |
|-----------|---------|---------|
| Solicitud de Material | `SOL` | SOL-YYYY-NNNNN |
| Cotización | `COT` | COT-YYYY-NNNNN |
| Solicitud de Autorización | `AUT` | AUT-YYYY-NNNNN |
| Orden de Compra | `OC` | OC-YYYY-NNNNN |
| Recepción de Bienes | `REC` | REC-YYYY-NNNNN |
| Salida de Bienes | `SAL` | SAL-YYYY-NNNNN |
| Solicitud de Gasto | `SOG` | SOG-YYYY-NNNNN |
| Solicitud de Pago | `SOP` | SOP-YYYY-NNNNN |

---

## 4. Inventario y Distribución

```mermaid
erDiagram
    OrdenCompra ||--o{ EntregaBienes : "orden_id"
    EntregaBienes ||--o{ EntregaDetalle : "entrega_id"
    DetalleOrden ||--o{ EntregaDetalle : "detalle_orden_id"
    EntregaBienes ||--o{ EvidenciaEntrega : "entrega_id"
    Factura ||--o{ EntregaBienes : "factura_id (opc)"
    Area ||--o{ SalidaBienes : "almacen_id (origen)"
    Area ||--o{ SalidaBienes : "destino_area_id"
    SalidaBienes ||--o{ SalidaDetalle : "salida_id"

    EntregaBienes {
        bigint id PK
        varchar numero UK "REC-YYYY-NNNNN"
        bigint orden_id FK
        bigint factura_id FK "opc"
        timestamp fecha_recepcion
        text notas
        bigint recibido_por_id FK
        boolean completa
    }

    EntregaDetalle {
        bigint id PK
        bigint entrega_id FK
        bigint detalle_orden_id FK
        decimal cantidad_recibida "15,4"
        text notas
        boolean condicion_buena
        text observaciones_condicion
    }

    EvidenciaEntrega {
        bigint id PK
        bigint entrega_id FK
        varchar imagen "upload_to='evidencias/entregas/'"
        varchar descripcion
    }

    SalidaBienes {
        bigint id PK
        varchar numero UK "SAL-YYYY-NNNNN"
        bigint almacen_id FK
        bigint destino_area_id FK
        timestamp fecha
        varchar referencia
        text notas
        bigint responsable_id FK
        boolean confirmada
        bigint confirmada_por_id FK
        timestamp fecha_confirmacion
    }

    SalidaDetalle {
        bigint id PK
        bigint salida_id FK
        varchar material "500 chars"
        text descripcion
        decimal cantidad "15,4"
        varchar unidad
    }
```

---

## 5. Facturación CFDI 4.0

```mermaid
erDiagram
    Proveedor ||--o{ Factura : "proveedor_id (opc, auto-detect)"
    Factura ||--o{ FacturaDetalle : "factura_id"
    FacturaDetalle ||--o{ DistribucionGasto : "concepto_id"
    Factura ||--o{ DistribucionGasto : "factura_id"
    Area ||--o{ DistribucionGasto : "area_id"
    SolicitudMaterial ||--o{ DistribucionGasto : "solicitud_id (opc)"

    Factura {
        bigint id PK
        varchar uuid_cfdi UK "36 chars"
        varchar xml_file "upload_to='facturas/xml/'"
        varchar pdf_file "upload_to='facturas/pdf/'"
        varchar folio
        varchar serie
        timestamp fecha
        varchar rfc_emisor
        varchar nombre_emisor
        varchar rfc_receptor
        varchar nombre_receptor
        decimal subtotal "15,2"
        decimal descuento "15,2"
        decimal iva "15,2"
        decimal isr "15,2 ISR retenido"
        decimal iva_retenido "15,2"
        decimal total "15,2"
        varchar forma_pago
        varchar metodo_pago "PUE|PPD"
        varchar moneda "default: MXN"
        varchar tipo_comprobante "I|E|P|T|N"
        varchar uso_cfdi "G01|G03|..."
        json parsed_json "XML parseado completo"
        varchar status "pendiente|procesando|procesada|error|distribuida"
        boolean is_quick_flow "flujo rápido sín solicitud"
        bigint proveedor_id FK "opc, auto-detectado"
        bigint uploaded_by_id FK
    }

    FacturaDetalle {
        bigint id PK
        bigint factura_id FK
        varchar clave_prod_serv "SAT"
        varchar no_identificacion
        decimal cantidad "15,4"
        varchar clave_unidad
        varchar unidad
        text descripcion
        decimal valor_unitario "15,6"
        decimal importe "15,2"
        decimal descuento "15,2"
        varchar objeto_imp "01|02|03"
        json impuestos "traslados + retenciones"
    }

    DistribucionGasto {
        bigint id PK
        bigint factura_id FK
        bigint concepto_id FK "FacturaDetalle"
        bigint area_id FK
        bigint solicitud_id FK "opc"
        decimal monto "15,2"
        decimal porcentaje "5,2 default: 100"
        text notas
        bigint created_by_id FK
    }
```

---

## 6. Tesorería y Presupuestos

```mermaid
erDiagram
    Factura ||--o{ SolicitudGasto : "factura_id"
    SolicitudGasto ||--o{ ItemSolicitudGasto : "solicitud_gasto_id"
    SolicitudGasto ||--|| SolicitudPago : "solicitud_gasto_id (OneToOne)"
    SolicitudPago ||--o{ ItemSolicitudPago : "solicitud_pago_id"
    Area ||--o{ ItemSolicitudGasto : "area_id"
    Area ||--o{ ItemSolicitudPago : "area_id"
    Tenant ||--o{ PlantillaPresupuestal : "tenant_id"
    PlantillaPresupuestal ||--o{ ItemClavePres : "plantilla_id"

    SolicitudGasto {
        bigint id PK
        varchar numero UK "SOG-YYYY-NNNNN"
        bigint factura_id FK
        varchar fondo_programa "200 chars"
        varchar tipo_material "200 chars"
        date fecha_solicitud
        bigint solicitante_id FK
        varchar estado "BORRADOR|ENVIADA|AUTORIZADA|RECHAZADA"
    }

    ItemSolicitudGasto {
        bigint id PK
        bigint solicitud_gasto_id FK
        bigint area_id FK
        varchar clave_presupuestaria "200 chars"
        varchar concepto_bien "200 chars"
        varchar descripcion_adquirido "200 chars"
        decimal cantidad "10,2"
        decimal precio_unitario "12,2"
        decimal costo_total "14,2"
    }

    SolicitudPago {
        bigint id PK
        varchar numero UK "SOP-YYYY-NNNNN"
        bigint solicitud_gasto_id FK "OneToOne"
        varchar banco "100 chars"
        varchar numero_cuenta "50 chars"
        varchar cog_clave "20 chars"
        varchar cog_nombre "200 chars"
        date fecha_solicitud
        varchar estado "BORRADOR|ENVIADA|PAGADA|RECHAZADA"
    }

    ItemSolicitudPago {
        bigint id PK
        bigint solicitud_pago_id FK
        bigint area_id FK
        varchar clave_presupuestaria "200 chars"
        decimal importe "14,2"
    }

    PlantillaPresupuestal {
        bigint id PK
        bigint tenant_id FK
        varchar nombre
        integer ejercicio_fiscal
        varchar entidad_federativa
        varchar clasificador_administrativo
        varchar unidad_administrativa
    }

    ItemClavePres {
        bigint id PK
        bigint plantilla_id FK
        varchar unidad_ejecutora_gasto
        varchar cog
        varchar cog_fondo "4to dígito"
        varchar cog_desagregacion "3er dígito"
        varchar clasificador_programatico
        varchar tipo_gasto
        varchar finalidad_funcion
        varchar fuente_financiamiento
        varchar clasificador_economico
        varchar actividad_institucional
        varchar programa_presupuestario
        varchar accion
    }
```

---

## 7. Documentos, Media y Auditoría

```mermaid
erDiagram
    User ||--o{ Notification : "user_id"
    User ||--o{ ActivityLog : "user_id"

    Notification {
        bigint id PK
        bigint user_id FK
        varchar tipo "info|success|warning|error"
        varchar title
        text message
        varchar action_url
        boolean read
        timestamp read_at
    }

    ActivityLog {
        bigint id PK
        bigint user_id FK
        varchar accion "crear|actualizar|eliminar|aprobar|rechazar|subir|generar"
        varchar modelo "100 chars"
        integer objeto_id
        text descripcion
        json datos_anteriores
        json datos_nuevos
        varchar ip_address
        varchar user_agent
    }

    PDFDocument {
        bigint id PK
        integer content_type_id "GenericFK"
        integer object_id "GenericFK"
        varchar tipo "solicitud|cotizacion|autorizacion|orden_compra|entrega|salida|reporte"
        varchar nombre
        varchar pdf_file "upload_to='documents/pdf/'"
        varchar generated_by_task "Celery task ID"
        varchar template_used
        bigint generated_by_id FK
    }

    Media {
        bigint id PK
        varchar file "upload_to='media/files/'"
        varchar original_name
        varchar content_type "MIME"
        integer size "bytes"
        bigint owner_id FK
        json metadata
    }
```

**PDFDocument** usa `GenericForeignKey` de Django para vincularse a cualquier entidad (SolicitudMaterial, CotizacionMaterial, OrdenCompra, etc.). Los PDFs se generan asíncronamente vía Celery + WeasyPrint.

---

## 8. Catálogo COG

Clasificador por Objeto del Gasto — catálogo presupuestario mexicano con jerarquía de 4 niveles.

```mermaid
erDiagram
    Cog {
        bigint id PK
        varchar codigo UK "ej: 21101"
        varchar descripcion "500 chars"
        varchar capitulo "2000"
        varchar concepto "2100"
        varchar partida_generica "2110"
        varchar partida_especifica "21101"
        text palabras_clave "búsqueda full-text"
        boolean is_active
    }
```

### Jerarquía del COG

```
Capítulo 2000 — Materiales y Suministros
  └─ Concepto 2100 — Materiales de Administración
       └─ PG 2110 — Materiales de Oficina
            ├─ PE 21101 — Papelería
            └─ PE 21102 — Útiles de Oficina
       └─ PG 2160 — Material de Cómputo
            ├─ PE 21601 — Consumibles de Cómputo
            └─ PE 21602 — Tóner y Cartuchos
```

El COG se relaciona con `DetalleMaterial` (clasifica cada ítem de solicitud) y con `ProductoProveedor` (catálogo de productos del proveedor).

---

## Índices y Optimización

### Índices por Aplicación

| App | Tabla | Índices |
|-----|-------|---------|
| accounts | User | email (UK), role_id, is_active |
| companies | Proveedor | rfc (UK), user_id (UK), estado, contacto_email |
| companies | ProductoProveedor | (proveedor, nombre, unidad) UK |
| companies | FirmanteDocumento | (company, tipo_documento, orden) UK |
| areas | Area | (company, code) UK, parent_id |
| areas | PersonalArea | (user, area) UK |
| procurement | Cog | codigo (UK) |
| procurement | SolicitudMaterial | numero (UK), estado, area_id, created_by_id |
| procurement | DetalleMaterial | solicitud_id, cog_id |
| quotations | CotizacionMaterial | numero (UK), solicitud_id, proveedor_id, estado |
| orders | OrdenCompra | numero (UK), proveedor_id, estado, fecha_emision |
| orders | SolicitudAutorizacion | numero (UK), solicitud_id |
| orders | AutorizacionPresupuestal | solicitud_autorizacion_id (UK) |
| inventory | EntregaBienes | numero (UK), orden_id, fecha_recepcion |
| inventory | SalidaBienes | numero (UK), almacen_id, destino_area_id |
| invoices | Factura | uuid_cfdi (UK), proveedor_id, rfc_emisor, status, fecha |
| invoices | DistribucionGasto | factura_id, area_id, concepto_id |
| treasury | SolicitudGasto | numero (UK), factura_id |
| treasury | SolicitudPago | numero (UK), solicitud_gasto_id (UK) |
| budget | PlantillaPresupuestal | (tenant, nombre, ejercicio_fiscal) UK |
| notifications | Notification | user_id, read, created_at |
| notifications | ActivityLog | user_id, modelo, created_at |

### Índices Compuestos para Rendimiento

```sql
-- Dashboard: solicitudes por estado y fecha
CREATE INDEX idx_sol_estado_fecha
ON procurement_solicitudmaterial(estado, created_at DESC);

-- Órdenes pendientes de entrega
CREATE INDEX idx_orden_pendiente
ON orders_ordencompra(estado, proveedor_id)
WHERE estado IN ('enviada', 'confirmada', 'parcial');

-- Facturas pendientes de procesar
CREATE INDEX idx_factura_pendiente
ON invoices_factura(status, fecha)
WHERE status = 'pendiente';

-- Distribuciones por área (reportes financieros)
CREATE INDEX idx_dist_area_monto
ON invoices_distribuciongasto(area_id, monto);

-- Búsqueda full-text: proveedores
CREATE INDEX idx_proveedor_search
ON companies_proveedor
USING gin(to_tsvector('spanish', razon_social || ' ' || rfc));

-- Búsqueda full-text: COG
CREATE INDEX idx_cog_search
ON procurement_cog
USING gin(to_tsvector('spanish', descripcion || ' ' || palabras_clave));
```

---

## Migraciones y Backup

### Comandos Django

```bash
# Windows PowerShell (desde backend/)
python manage.py makemigrations <app_name>
python manage.py sqlmigrate <app_name> <migration_number>
python manage.py migrate
python manage.py migrate_schemas       # django-tenants: replica en todos los tenants
python manage.py showmigrations

# Crear tenant
python manage.py create_tenant --schema_name=org_001 --name="Organización" --domain=org.midominio.com
```

### Backup PostgreSQL (Producción)

```bash
# Backup completo (todos los esquemas)
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -f backup_$(date +%Y%m%d).dump

# Backup de un tenant específico
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -n schema_001 -F c -f tenant_001.dump

# Restore
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME -c backup_20260505.dump
```

### Backup SQLite (Desarrollo)

```powershell
Copy-Item -LiteralPath "db.sqlite3" -Destination "db_backup_$(Get-Date -Format 'yyyyMMdd').sqlite3"
```

---

*Última actualización: mayo 2026 — 38 entidades, 13 apps Django, PostgreSQL 15+ con django-tenants.*

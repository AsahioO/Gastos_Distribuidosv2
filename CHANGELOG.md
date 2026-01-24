# 📋 Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Por Implementar
- Fase 10: Notificaciones en tiempo real
- Fase 11: Autorizaciones y firmas digitales
- Fase 12: Documentos adjuntos
- Fase 13: Configuración del sistema

---

## [0.9.0] - 2026-01-24

### 🎉 Portal de Proveedores (Fase 9)

#### Backend
- **Añadido** `ProveedorDashboardView` - Dashboard exclusivo para proveedores con estadísticas
- **Añadido** `SolicitudesParaCotizarView` - Lista de solicitudes abiertas para cotizar
- **Añadido** Endpoints en `/api/reports/proveedor/`

#### Frontend
- **Añadido** Directorio `src/pages/proveedor/` con páginas del portal
- **Añadido** `ProveedorDashboardPage` - Dashboard con info de empresa, estadísticas, órdenes recientes
- **Añadido** `SolicitudesCotizarPage` - Lista de solicitudes disponibles para cotizar
- **Añadido** `NuevaCotizacionPage` - Formulario para enviar cotizaciones
- **Añadido** `MisCotizacionesPage` - Historial de cotizaciones con filtros por estado
- **Añadido** `MisOrdenesPage` - Órdenes asignadas con opción de confirmar
- **Añadido** `MisFacturasPage` - Estado de facturas del proveedor
- **Añadido** `proveedorPortalService.ts` - Servicio API para el portal
- **Añadido** Navegación diferenciada para rol proveedor en `MainLayout`
- **Añadido** Rutas protegidas `/portal/*` en `App.tsx`
- **Añadido** Componente `TextArea` en UI
- **Mejorado** Componente `Card` - Añadida prop `onClick`
- **Mejorado** Redirección automática de proveedores a `/portal`

---

## [0.8.0] - 2026-01-23

### 📊 Dashboard con Filtrado por Rol

#### Backend
- **Añadido** `get_role_filtered_querysets()` - Función central de filtrado por rol
- **Añadido** Filtrado automático en todas las vistas del dashboard
- **Corregido** Referencias a campos del modelo (manager vs responsable, status vs estado)

#### Frontend
- **Añadido** `dashboardService.ts` - Servicio para APIs del dashboard
- **Mejorado** Dashboard muestra datos filtrados según el rol del usuario

---

## [0.7.0] - 2026-01-22

### 📈 Reportes y Gráficos

#### Backend
- **Añadido** App `reports` con vistas de estadísticas
- **Añadido** `DashboardStatsView` - Estadísticas generales
- **Añadido** `GastosPorAreaView` - Gastos agrupados por área
- **Añadido** `GastosMensualesView` - Tendencia mensual de gastos
- **Añadido** `SolicitudesRecientesView` - Últimas solicitudes
- **Añadido** `ActividadRecienteView` - Actividad reciente del sistema

#### Frontend
- **Añadido** `ReportesPage` - Página de reportes con gráficos
- **Añadido** Componentes de gráficos con Recharts
- **Añadido** Dashboard mejorado con KPIs y visualizaciones

---

## [0.6.0] - 2026-01-21

### 🧾 Facturas y Distribución de Gastos (Fase 8)

#### Backend
- **Añadido** App `invoices` con modelos Factura, DistribucionGasto
- **Añadido** Carga de archivos XML/PDF de facturas
- **Añadido** Endpoint de distribución de gastos por área

#### Frontend
- **Añadido** `FacturasPage` - Lista de facturas con filtros
- **Añadido** `FacturaUploadPage` - Subida de facturas
- **Añadido** `FacturaDetailPage` - Detalle de factura
- **Añadido** `FacturaDistributePage` - Distribución a áreas

---

## [0.5.0] - 2026-01-20

### 📦 Inventario y Almacén (Fase 7)

#### Backend
- **Añadido** App `inventory` con modelos EntregaMaterial, SalidaMaterial
- **Añadido** Control de cantidades recibidas vs pendientes

#### Frontend
- **Añadido** `EntregasPage` - Recepción de materiales
- **Añadido** `EntregaFormPage` - Registro de entregas
- **Añadido** `SalidasPage` - Salidas de almacén
- **Añadido** `SalidaFormPage` - Registro de salidas

---

## [0.4.0] - 2026-01-19

### 🛒 Órdenes de Compra (Fase 6)

#### Backend
- **Añadido** App `orders` con modelos SolicitudAutorizacion, AutorizacionPresupuestal, OrdenCompra
- **Añadido** Flujo de autorización presupuestal
- **Añadido** Acciones: send, confirm, cancel en órdenes

#### Frontend
- **Añadido** `OrdenesPage` - Lista de órdenes de compra
- **Añadido** `OrdenFormPage` - Creación/edición de órdenes
- **Añadido** `OrdenDetailPage` - Detalle con acciones

---

## [0.3.0] - 2026-01-18

### 📝 Cotizaciones (Fase 5)

#### Backend
- **Añadido** App `quotations` con modelos CotizacionMaterial, DetalleCotizacion
- **Añadido** Acción de seleccionar cotización ganadora

#### Frontend
- **Añadido** `CotizacionesPage` - Lista de cotizaciones
- **Añadido** `CotizacionFormPage` - Creación de cotizaciones
- **Añadido** `CotizacionDetailPage` - Detalle con opción de seleccionar

---

## [0.2.0] - 2026-01-17

### 📄 Solicitudes de Material (Fase 4)

#### Backend
- **Añadido** App `procurement` con modelos COG, SolicitudMaterial, DetalleMaterial
- **Añadido** Catálogo de productos (COGs)
- **Añadido** Flujo de estados de solicitudes

#### Frontend
- **Añadido** `SolicitudesPage` - Lista con filtros y búsqueda
- **Añadido** `SolicitudFormPage` - Formulario con líneas de detalle
- **Añadido** `SolicitudDetailPage` - Vista detallada
- **Añadido** `procurementService.ts` - Servicio API

---

## [0.1.0] - 2026-01-16

### 🔐 Autenticación y Base (Fases 1-3)

#### Backend
- **Añadido** App `accounts` con modelo User personalizado
- **Añadido** Sistema de roles (admin, tesoreria, adquisiciones, almacen, area, proveedor)
- **Añadido** Autenticación JWT con SimpleJWT
- **Añadido** App `areas` para gestión de departamentos
- **Añadido** App `companies` para empresas y proveedores
- **Añadido** Configuración de desarrollo con SQLite

#### Frontend
- **Añadido** Proyecto React + TypeScript + Vite
- **Añadido** Configuración TailwindCSS
- **Añadido** Sistema de autenticación con Zustand
- **Añadido** `LoginPage` con validación
- **Añadido** `MainLayout` con navegación sidebar
- **Añadido** `DashboardPage` inicial
- **Añadido** Páginas de administración: Users, Áreas, Proveedores
- **Añadido** Componentes UI base: Button, Card, Input, Select, Modal, Table
- **Añadido** Servicios API: auth, users, areas, proveedores

---

## Tipos de Cambios

- 🎉 **Añadido** para nuevas características
- 🔄 **Cambiado** para cambios en funcionalidades existentes
- ⚠️ **Deprecado** para características que serán removidas
- 🗑️ **Removido** para características eliminadas
- 🐛 **Corregido** para corrección de bugs
- 🔒 **Seguridad** para vulnerabilidades

# 📋 Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🛡️ Seguridad - Validación de Facturas

#### Backend - Validaciones CFDI
- **Agregado** Bloque de validación draft para verificar coincidencia de RFC receptor (POST `/api/invoices/upload-and-process/`)
  - Extrae RFC receptor desde `cfdi:Receptor/@Rfc`
  - Compara contra empresa configurada en sistema
  - Permite validación case-insensitive
  - Nota: Validación actualmente desactivada para permitir procesamiento flexible de facturas
- **Mejora Documentada** En [docs/SECURITY_ANALYSIS.md](docs/SECURITY_ANALYSIS.md#inv-receptor-rfc) se registra la vulnerabilidad y el parche implementado

#### Workflow de Implementación
- Validación implementada en [backend/apps/invoices/tasks.py](backend/apps/invoices/tasks.py) línea ~62
- Imports: `Company` model y `ValidationError` desde DRF
- Excepción separada para `ValidationError` en bloque except
- Desactivada mediante comentario para evaluación posterior

### Por Implementar
- Fase 10: Notificaciones en tiempo real
- Fase 11: Autorizaciones y firmas digitales
- Fase 12: Documentos adjuntos
- Fase 13: Configuración del sistema
- Sistema de plantillas personalizables para generación de PDFs

---

## [0.9.2] - 2026-02-06

### 👤 Personalización de Perfil de Usuario

#### Backend - Modelos
- **Añadido** Campo `logo` (ImageField) al modelo `Company` para logos empresariales
- **Añadido** Campo `logo` (ImageField) al modelo `Proveedor` para logos de proveedores
- **Migración** `0002_company_logo_proveedor_logo` aplicada exitosamente

#### Backend - Serializers & API
- **Mejorado** `CompanySerializer` - Incluye campo `logo` en la respuesta
- **Mejorado** `ProveedorSerializer` - Incluye campo `logo` en la respuesta
- **Mejorado** `CustomTokenObtainPairSerializer` - Incluye `avatar` y `phone` en respuesta de login JWT
- **Corregido** Configuración de MEDIA proxy faltante para servir avatares en desarrollo

#### Frontend - Sistema de Perfil
- **Añadido** Página `/perfil` (`ProfilePage.tsx`) con 3 tabs:
  - Información Personal: Edición de nombre, teléfono y avatar
  - Contraseña: Cambio seguro de contraseña
  - Preferencias: Notificaciones y configuración (placeholder)
- **Añadido** Componente `AvatarUpload` reutilizable:
  - Drag & drop de imágenes
  - Preview en tiempo real
  - Validación: JPG/PNG/WebP, máx 2MB
  - Soporte para avatares circulares y logos cuadrados
- **Añadido** Enlace clickeable al perfil en sidebar y top bar
- **Mejorado** Avatares reales en MainLayout (sidebar y top bar)
- **Mejorado** Tabla de usuarios muestra fotos reales de perfil

#### Frontend - Portal de Proveedores
- **Añadido** Visualización de logo de proveedor en dashboard
- **Añadido** Enlace "Editar perfil" en header del portal

#### Frontend - State Management
- **Mejorado** `authStore.ts` - Añadido método `updateUser()` para actualizar perfil localmente
- **Mejorado** `userService.ts` - Nuevos métodos:
  - `updateMyProfile()` con soporte para FormData/multipart
  - `getMyProfile()` para obtener datos del usuario autenticado
  - `changePassword()` para cambio de contraseña
- **Corregido** Interface `User` con campo `avatar` opcional

#### Configuración
- **Añadido** Proxy `/media` en `vite.config.ts` para desarrollo local
- **Corregido** Target del proxy de `backend:8000` a `localhost:8000` para entorno sin Docker

#### Imágenes y Media
- **Configurado** Rutas de upload:
  - `avatars/` para fotos de perfil de usuarios
  - `company_logos/` para logos de empresas
  - `proveedor_logos/` para logos de proveedores

---

## [0.9.1] - 2026-01-27

### 🔒 Análisis de Seguridad y Mejoras de UI

#### Seguridad
- **Añadido** `docs/SECURITY_ANALYSIS.md` - Análisis completo de seguridad con vulnerabilidades y soluciones
- **Documentado** Vulnerabilidades críticas: SECRET_KEY hardcodeada, CORS permisivo en local
- **Documentado** Almacenamiento de tokens en localStorage y recomendaciones de httpOnly cookies
- **Documentado** Plan de remediación en 3 fases

#### Backend - Usuarios
- **Corregido** `UserSerializer` - Añadido campo `role_display` para mostrar nombre de rol correctamente
- **Corregido** `UserViewSet` - Deshabilitada paginación para cargar todos los usuarios
- **Mejorado** `UserCreateSerializer` - Manejo robusto de creación de proveedores con RFC único
- **Añadido** Soft delete en `UserViewSet.destroy()` - Desactiva usuarios con registros asociados

#### Backend - Dashboard
- **Añadido** Management command `populate_demo_data` en `apps/reports/management/commands/`
- **Añadido** Datos de demostración: presupuestos, facturas y distribuciones de gastos

#### Frontend - Dashboard
- **Rediseñado** `DashboardPage` header con gradiente indigo-purple premium
- **Añadido** Glassmorphism con backdrop-blur y bordes translúcidos
- **Añadido** Patrón de puntos decorativo y efectos de sombra con color
- **Rediseñado** `Card.tsx` - Nuevos gradientes premium (primary, success, warning, purple)
- **Añadido** Sombras coloreadas para cada tipo de gradiente
- **Añadido** Animaciones de hover en círculos decorativos de StatCard

#### Frontend - Usuarios
- **Mejorado** `UsersPage` - Filtros dinámicos por rol con contadores
- **Añadido** Búsqueda de usuarios por nombre, email o username
- **Añadido** Avatares con iniciales y colores por rol
- **Mejorado** Manejo de errores con mensajes descriptivos

#### Componentes UI
- **Añadido** `PageHeader` - Componente reutilizable con 3 variantes (default, gradient, minimal)

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

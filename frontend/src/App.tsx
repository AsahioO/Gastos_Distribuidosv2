import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ReportesPage from '@/pages/reportes/ReportesPage'
import UsersPage from '@/pages/admin/UsersPage'
import AreasPage from '@/pages/admin/AreasPage'
import ProveedoresPage from '@/pages/admin/ProveedoresPage'
import SolicitudesPage from '@/pages/procurement/SolicitudesPage'
import SolicitudFormPage from '@/pages/procurement/SolicitudFormPage'
import SolicitudDetailPage from '@/pages/procurement/SolicitudDetailPage'
import CotizacionesPage from '@/pages/quotations/CotizacionesPage'
import CotizacionFormPage from '@/pages/quotations/CotizacionFormPage'
import CotizacionDetailPage from '@/pages/quotations/CotizacionDetailPage'
import OrdenesPage from '@/pages/orders/OrdenesPage'
import OrdenFormPage from '@/pages/orders/OrdenFormPage'
import OrdenDetailPage from '@/pages/orders/OrdenDetailPage'
// Inventory pages
import EntregasPage from '@/pages/inventory/EntregasPage'
import EntregaFormPage from '@/pages/inventory/EntregaFormPage'
import EntregaDetailPage from '@/pages/inventory/EntregaDetailPage'
import SalidasPage from '@/pages/inventory/SalidasPage'
import SalidaFormPage from '@/pages/inventory/SalidaFormPage'
import SalidaDetailPage from '@/pages/inventory/SalidaDetailPage'
// Invoice pages
import FacturasPage from '@/pages/invoices/FacturasPage'
import FacturaUploadPage from '@/pages/invoices/FacturaUploadPage'
import FacturaDetailPage from '@/pages/invoices/FacturaDetailPage'
import FacturaDistributePage from '@/pages/invoices/FacturaDistributePage'
// Portal del Proveedor - Fase 9
import ProveedorDashboardPage from '@/pages/proveedor/ProveedorDashboardPage'
import SolicitudesCotizarPage from '@/pages/proveedor/SolicitudesCotizarPage'
import NuevaCotizacionPage from '@/pages/proveedor/NuevaCotizacionPage'
import MisCotizacionesPage from '@/pages/proveedor/MisCotizacionesPage'
import MisOrdenesPage from '@/pages/proveedor/MisOrdenesPage'
import MisFacturasPage from '@/pages/proveedor/MisFacturasPage'

// Protected Route component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirigir proveedores a su portal, otros al dashboard
    const redirectTo = user.role === 'proveedor' ? '/portal' : '/dashboard'
    return <Navigate to={redirectTo} replace />
  }
  
  return <>{children}</>
}

// Componente para redirección según rol
function HomeRedirect() {
  const { user } = useAuthStore()
  
  if (user?.role === 'proveedor') {
    return <Navigate to="/portal" replace />
  }
  
  return <Navigate to="/dashboard" replace />
}

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected routes */}
      <Route
        element={
          isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        
        {/* Portal del Proveedor - Fase 9 */}
        <Route path="/portal" element={
          <ProtectedRoute allowedRoles={['proveedor']}>
            <ProveedorDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/portal/cotizar" element={
          <ProtectedRoute allowedRoles={['proveedor']}>
            <SolicitudesCotizarPage />
          </ProtectedRoute>
        } />
        <Route path="/portal/cotizar/:solicitudId" element={
          <ProtectedRoute allowedRoles={['proveedor']}>
            <NuevaCotizacionPage />
          </ProtectedRoute>
        } />
        <Route path="/portal/cotizaciones" element={
          <ProtectedRoute allowedRoles={['proveedor']}>
            <MisCotizacionesPage />
          </ProtectedRoute>
        } />
        <Route path="/portal/ordenes" element={
          <ProtectedRoute allowedRoles={['proveedor']}>
            <MisOrdenesPage />
          </ProtectedRoute>
        } />
        <Route path="/portal/ordenes/:id" element={
          <ProtectedRoute allowedRoles={['proveedor']}>
            <OrdenDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/portal/facturas" element={
          <ProtectedRoute allowedRoles={['proveedor']}>
            <MisFacturasPage />
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/usuarios" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        } />
        <Route path="/areas" element={
          <ProtectedRoute allowedRoles={['admin', 'tesoreria']}>
            <AreasPage />
          </ProtectedRoute>
        } />
        <Route path="/proveedores" element={
          <ProtectedRoute allowedRoles={['admin', 'adquisiciones']}>
            <ProveedoresPage />
          </ProtectedRoute>
        } />
        
        {/* Procurement routes */}
        <Route path="/solicitudes" element={<SolicitudesPage />} />
        <Route path="/solicitudes/nueva" element={<SolicitudFormPage />} />
        <Route path="/solicitudes/:id" element={<SolicitudDetailPage />} />
        <Route path="/solicitudes/:id/editar" element={<SolicitudFormPage />} />
        
        {/* Quotation routes */}
        <Route path="/cotizaciones" element={<CotizacionesPage />} />
        <Route path="/cotizaciones/nueva" element={<CotizacionFormPage />} />
        <Route path="/cotizaciones/:id" element={<CotizacionDetailPage />} />
        <Route path="/cotizaciones/:id/editar" element={<CotizacionFormPage />} />
        
        {/* Order routes */}
        <Route path="/ordenes" element={<OrdenesPage />} />
        <Route path="/ordenes/nueva" element={<OrdenFormPage />} />
        <Route path="/ordenes/:id" element={<OrdenDetailPage />} />
        <Route path="/ordenes/:id/editar" element={<OrdenFormPage />} />
        
        {/* Inventory routes */}
        <Route path="/inventario/entregas" element={<EntregasPage />} />
        <Route path="/inventario/entregas/nueva" element={<EntregaFormPage />} />
        <Route path="/inventario/entregas/:id" element={<EntregaDetailPage />} />
        <Route path="/inventario/salidas" element={<SalidasPage />} />
        <Route path="/inventario/salidas/nueva" element={<SalidaFormPage />} />
        <Route path="/inventario/salidas/:id" element={<SalidaDetailPage />} />
        <Route path="/inventario" element={<Navigate to="/inventario/entregas" replace />} />
        
        {/* Invoice routes */}
        <Route path="/facturas" element={<FacturasPage />} />
        <Route path="/facturas/subir" element={<FacturaUploadPage />} />
        <Route path="/facturas/:id" element={<FacturaDetailPage />} />
        <Route path="/facturas/:id/distribuir" element={<FacturaDistributePage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

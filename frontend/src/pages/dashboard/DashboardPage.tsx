import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { dashboardService, type DashboardStats, type GastosPorArea, type GastosMensuales, type SolicitudReciente, type ActividadReciente } from '@/services/dashboardService'
import { Card, StatCard, StatusBadge, LoadingOverlay, ProgressBar } from '@/components/ui'
import { ExpenseBarChart, TrendLineChart, DistributionPieChart } from '@/components/charts/Charts'
import {
  DocumentTextIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  BellAlertIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [gastosPorArea, setGastosPorArea] = useState<GastosPorArea[]>([])
  const [gastosMensuales, setGastosMensuales] = useState<GastosMensuales[]>([])
  const [solicitudesRecientes, setSolicitudesRecientes] = useState<SolicitudReciente[]>([])
  const [actividad, setActividad] = useState<ActividadReciente[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, areasData, mensualesData, solicitudesData, actividadData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getGastosPorArea(),
        dashboardService.getGastosMensuales(),
        dashboardService.getSolicitudesRecientes(),
        dashboardService.getActividadReciente(),
      ])
      setStats(statsData)
      setGastosPorArea(areasData)
      setGastosMensuales(mensualesData)
      setSolicitudesRecientes(solicitudesData)
      setActividad(actividadData)
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const getActivityIcon = (tipo: ActividadReciente['tipo']) => {
    const icons = {
      solicitud: <DocumentTextIcon className="w-5 h-5 text-blue-500" />,
      cotizacion: <ChartBarIcon className="w-5 h-5 text-purple-500" />,
      orden: <ShoppingCartIcon className="w-5 h-5 text-emerald-500" />,
      factura: <CurrencyDollarIcon className="w-5 h-5 text-amber-500" />,
      entrega: <TruckIcon className="w-5 h-5 text-teal-500" />,
    }
    return icons[tipo] || <DocumentTextIcon className="w-5 h-5 text-gray-500" />
  }

  const getRoleLabel = (role: string | null): string => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      tesoreria: 'Tesorería',
      adquisiciones: 'Adquisiciones',
      almacen: 'Almacén',
      area: 'Responsable de Área',
      proveedor: 'Proveedor',
    }
    return role ? labels[role] || role : 'Usuario'
  }

  const getRoleColor = (role: string | null): string => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500',
      tesoreria: 'bg-amber-500',
      adquisiciones: 'bg-blue-500',
      almacen: 'bg-emerald-500',
      area: 'bg-purple-500',
      proveedor: 'bg-indigo-500',
    }
    return role ? colors[role] || 'bg-gray-500' : 'bg-gray-500'
  }

  // Determinar qué secciones mostrar según el rol
  // Usar primero el rol del usuario autenticado, luego el del API stats como fallback
  const userRole = user?.role || stats?.user_role || null
  
  // Roles con acceso a información financiera (presupuesto, facturas, gastos)
  const showFinancialInfo = ['admin', 'tesoreria'].includes(userRole || '')
  
  // Roles con acceso a solicitudes y cotizaciones
  const showProcurementInfo = ['admin', 'tesoreria', 'adquisiciones', 'area'].includes(userRole || '')
  
  // Roles con acceso a órdenes de compra (no almacén que solo ve entregas)
  const showOrdersInfo = ['admin', 'tesoreria', 'adquisiciones', 'area'].includes(userRole || '')
  
  // Roles con acceso a inventario/entregas
  const showWarehouseInfo = ['admin', 'almacen'].includes(userRole || '')
  
  // Es proveedor externo
  const showProviderInfo = userRole === 'proveedor'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingOverlay message="Cargando información del dashboard..." />
      </div>
    )
  }

  // Preparar datos para gráficos
  const barChartData = gastosPorArea.map(area => ({
    name: area.area,
    gastado: area.gastado,
    presupuesto: area.presupuesto,
  }))

  const pieChartData = gastosPorArea.map(area => ({
    name: area.area,
    value: area.gastado,
  }))

  // Evitar división por cero
  const presupuestoUsado = stats && stats.total_presupuesto > 0 
    ? (stats.total_gastado_mes / stats.total_presupuesto) * 100 
    : 0

  return (
    <div className="space-y-6 pb-8">
      {/* Header con saludo */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {getGreeting()}, {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario'} 👋
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(userRole)} text-white`}>
                  {getRoleLabel(userRole)}
                </span>
              </div>
              <p className="mt-2 text-blue-100 text-lg">
                {showProviderInfo 
                  ? 'Consulta tus cotizaciones y órdenes asignadas'
                  : 'Aquí está el resumen de tu gestión de gastos'}
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{stats?.solicitudes_pendientes || 0}</p>
                <p className="text-sm text-blue-200">{showProviderInfo ? 'Cotizaciones' : 'Pendientes'}</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-bold">{stats?.ordenes_activas || 0}</p>
                <p className="text-sm text-blue-200">Órdenes Activas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {showProcurementInfo && (
          <StatCard
            title={showProviderInfo ? "Cotizaciones Enviadas" : "Solicitudes Pendientes"}
            value={showProviderInfo ? stats?.cotizaciones_pendientes || 0 : stats?.solicitudes_pendientes || 0}
            gradient="blue"
            icon={<ClockIcon className="w-6 h-6" />}
            subtitle={showProviderInfo ? "Esperando respuesta" : "Esperando aprobación"}
          />
        )}
        {showProcurementInfo && (
          <StatCard
            title={showProviderInfo ? "Órdenes Asignadas" : "Solicitudes Aprobadas"}
            value={showProviderInfo ? stats?.ordenes_activas || 0 : stats?.solicitudes_aprobadas || 0}
            gradient="green"
            icon={<CheckCircleIcon className="w-6 h-6" />}
          />
        )}
        {showOrdersInfo && (
          <StatCard
            title="Órdenes de Compra"
            value={stats?.ordenes_activas || 0}
            gradient="purple"
            icon={<ShoppingCartIcon className="w-6 h-6" />}
            subtitle="En proceso"
          />
        )}
        {showFinancialInfo && (
          <StatCard
            title="Facturas Pendientes"
            value={stats?.facturas_pendientes || 0}
            gradient="orange"
            icon={<CurrencyDollarIcon className="w-6 h-6" />}
            subtitle="Por procesar"
          />
        )}
        {showProviderInfo && (
          <StatCard
            title="Entregas Completadas"
            value={stats?.ordenes_completadas || 0}
            gradient="purple"
            icon={<TruckIcon className="w-6 h-6" />}
            subtitle="Este mes"
          />
        )}
        {showWarehouseInfo && (
          <StatCard
            title="Entregas Pendientes"
            value={stats?.ordenes_activas || 0}
            gradient="orange"
            icon={<TruckIcon className="w-6 h-6" />}
            subtitle="Por recibir"
          />
        )}
      </div>

      {/* Presupuesto y Gasto del mes - Solo para roles financieros */}
      {showFinancialInfo && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white" shadow="lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Presupuesto del Mes</h3>
              <p className="text-sm text-gray-500">Control de gastos vs presupuesto asignado</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <ArrowTrendingUpIcon className="w-4 h-4" />
              <span className="text-sm font-medium">En control</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-500">Presupuesto Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats?.total_presupuesto || 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-600">Gastado</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {formatCurrency(stats?.total_gastado_mes || 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
              <p className="text-sm text-emerald-600">Disponible</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {formatCurrency(stats?.total_disponible || 0)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progreso del presupuesto</span>
              <span className="font-medium text-gray-900">{presupuestoUsado.toFixed(1)}%</span>
            </div>
            <ProgressBar
              value={presupuestoUsado}
              max={100}
              size="lg"
              color="auto"
              animated
            />
          </div>
        </Card>

        {/* Alertas y notificaciones */}
        <Card className="bg-white" shadow="lg">
          <div className="flex items-center gap-2 mb-4">
            <BellAlertIcon className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">Alertas</h3>
          </div>
          
          <div className="space-y-3">
            {stats?.solicitudes_pendientes ? (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {stats.solicitudes_pendientes} solicitudes pendientes
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Requieren tu atención</p>
                </div>
              </div>
            ) : null}
            
            {stats?.facturas_pendientes ? (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {stats.facturas_pendientes} facturas por procesar
                  </p>
                  <p className="text-xs text-blue-600 mt-1">En espera de validación</p>
                </div>
              </div>
            ) : null}

            {presupuestoUsado >= 80 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Presupuesto al {presupuestoUsado.toFixed(0)}%
                  </p>
                  <p className="text-xs text-red-600 mt-1">Cerca del límite mensual</p>
                </div>
              </div>
            )}

            {(!stats?.solicitudes_pendientes && !stats?.facturas_pendientes && presupuestoUsado < 80) && (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <p className="text-sm">No hay alertas activas</p>
              </div>
            )}
          </div>
        </Card>
      </div>
      )}

      {/* Gráficos - Solo para roles con acceso a información financiera */}
      {showFinancialInfo && gastosPorArea.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white" shadow="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gastos vs Presupuesto por Área</h3>
          <p className="text-sm text-gray-500 mb-4">Comparativa del mes actual</p>
          <ExpenseBarChart data={barChartData} height={280} />
        </Card>

        <Card className="bg-white" shadow="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tendencia Anual</h3>
          <p className="text-sm text-gray-500 mb-4">Evolución de gastos mensuales</p>
          <TrendLineChart data={gastosMensuales} height={280} />
        </Card>
      </div>
      )}

      {/* Gastos por área (detalle) y Distribución - Solo para roles financieros */}
      {showFinancialInfo && gastosPorArea.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white" shadow="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle por Área</h3>
          <div className="space-y-4">
            {gastosPorArea.map((area, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'][index % 5] }}
                    />
                    <span className="font-medium text-gray-900">{area.area}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      {formatCurrency(area.gastado)} / {formatCurrency(area.presupuesto)}
                    </span>
                  </div>
                </div>
                <ProgressBar
                  value={area.porcentaje}
                  max={100}
                  size="sm"
                  color="auto"
                  showLabel
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white" shadow="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Distribución de Gastos</h3>
          <p className="text-sm text-gray-500 mb-4">Por área del mes</p>
          <DistributionPieChart data={pieChartData} height={250} />
        </Card>
      </div>
      )}

      {/* Solicitudes recientes y Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solicitudes Recientes */}
        <Card className="bg-white" shadow="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Solicitudes Recientes</h3>
            <a href="/solicitudes" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver todas →
            </a>
          </div>
          <div className="divide-y divide-gray-100">
            {solicitudesRecientes.map((solicitud) => (
              <div key={solicitud.id} className="py-3 flex items-center justify-between hover:bg-gray-50 -mx-6 px-6 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{solicitud.numero}</p>
                    <p className="text-sm text-gray-500">{solicitud.area} • {solicitud.fecha}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-gray-900 hidden sm:block">
                    {formatCurrency(solicitud.total)}
                  </p>
                  <StatusBadge status={solicitud.estado} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actividad Reciente */}
        <Card className="bg-white" shadow="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {actividad.map((item, index) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getActivityIcon(item.tipo)}
                  </div>
                  {index < actividad.length - 1 && (
                    <div className="absolute left-1/2 top-10 bottom-0 w-px bg-gray-200 -translate-x-1/2 h-full" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-gray-900">{item.descripcion}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{item.fecha}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-500">{item.usuario}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage

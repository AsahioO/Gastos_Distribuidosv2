import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PaperAirplaneIcon,
  XCircleIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline'
import { Button, Table, Modal } from '@/components/ui'
import { procurementService, SolicitudMaterial } from '@/services/procurementService'
import { useAuthStore } from '@/stores/authStore'

const estadoColors: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-800',
  enviado: 'bg-blue-100 text-blue-800',
  en_cotizacion: 'bg-yellow-100 text-yellow-800',
  cotizado: 'bg-purple-100 text-purple-800',
  en_autorizacion: 'bg-orange-100 text-orange-800',
  autorizado: 'bg-green-100 text-green-800',
  en_orden: 'bg-indigo-100 text-indigo-800',
  parcial: 'bg-cyan-100 text-cyan-800',
  entregado: 'bg-emerald-100 text-emerald-800',
  cancelado: 'bg-red-100 text-red-800',
}

export default function SolicitudesPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [solicitudes, setSolicitudes] = useState<SolicitudMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudMaterial | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Determinar permisos según rol
  const isArea = user?.role === 'area'
  const isAdquisiciones = user?.role === 'adquisiciones'
  const isAdmin = user?.role === 'admin'
  const canCreateSolicitud = isArea || isAdmin

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await procurementService.getSolicitudes()
      setSolicitudes(data)
    } catch (error) {
      toast.error('Error al cargar las solicitudes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = () => {
    navigate('/solicitudes/nueva')
  }

  const handleView = (solicitud: SolicitudMaterial) => {
    navigate(`/solicitudes/${solicitud.id}`)
  }

  const handleEdit = (solicitud: SolicitudMaterial) => {
    navigate(`/solicitudes/${solicitud.id}/editar`)
  }

  const handleDelete = (solicitud: SolicitudMaterial) => {
    setSelectedSolicitud(solicitud)
    setDeleteModalOpen(true)
  }

  const handleEnviar = async (solicitud: SolicitudMaterial) => {
    try {
      await procurementService.enviarSolicitud(solicitud.id)
      toast.success('Solicitud enviada correctamente')
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al enviar la solicitud')
    }
  }

  const handleEnviarACotizacion = async (solicitud: SolicitudMaterial) => {
    try {
      await procurementService.enviarACotizacion(solicitud.id)
      toast.success('Solicitud enviada a cotización')
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al enviar a cotización')
    }
  }

  const handleCancelar = async (solicitud: SolicitudMaterial) => {
    try {
      await procurementService.cancelarSolicitud(solicitud.id)
      toast.success('Solicitud cancelada')
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al cancelar la solicitud')
    }
  }

  const confirmDelete = async () => {
    if (!selectedSolicitud) return
    setSubmitting(true)
    try {
      await procurementService.deleteSolicitud(selectedSolicitud.id)
      toast.success('Solicitud eliminada correctamente')
      setDeleteModalOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al eliminar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return '$0.00'
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const columns = [
    { 
      key: 'numero', 
      header: 'Número',
      render: (s: SolicitudMaterial) => (
        <span className="font-medium text-primary-600">{s.numero}</span>
      )
    },
    { 
      key: 'fecha_solicitud', 
      header: 'Fecha',
      render: (s: SolicitudMaterial) => formatDate(s.fecha_solicitud)
    },
    { key: 'area_name', header: 'Área' },
    { 
      key: 'descripcion', 
      header: 'Descripción',
      render: (s: SolicitudMaterial) => (
        <span className="max-w-xs truncate block">{s.descripcion || '-'}</span>
      )
    },
    {
      key: 'total_estimado',
      header: 'Total',
      render: (s: SolicitudMaterial) => formatCurrency(s.total_estimado)
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (s: SolicitudMaterial) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColors[s.estado] || 'bg-gray-100 text-gray-800'}`}>
          {s.estado_display}
        </span>
      )
    },
    {
      key: 'urgente',
      header: '',
      render: (s: SolicitudMaterial) => s.urgente ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          Urgente
        </span>
      ) : null
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (s: SolicitudMaterial) => (
        <div className="flex space-x-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleView(s) }}
            className="p-1 text-gray-500 hover:text-primary-600"
            title="Ver detalle"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          
          {/* Solo Área o Admin pueden editar/enviar borradores */}
          {s.estado === 'borrador' && (isArea || isAdmin) && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(s) }}
                className="p-1 text-gray-500 hover:text-primary-600"
                title="Editar"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleEnviar(s) }}
                className="p-1 text-gray-500 hover:text-green-600"
                title="Enviar solicitud"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(s) }}
                className="p-1 text-gray-500 hover:text-red-600"
                title="Eliminar"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </>
          )}
          
          {/* Adquisiciones o Admin pueden enviar a cotización las solicitudes enviadas */}
          {s.estado === 'enviado' && (isAdquisiciones || isAdmin) && (
            <button
              onClick={(e) => { e.stopPropagation(); handleEnviarACotizacion(s) }}
              className="p-1 text-gray-500 hover:text-purple-600"
              title="Enviar a cotización"
            >
              <DocumentArrowUpIcon className="h-5 w-5" />
            </button>
          )}
          
          {/* Solo quien creó o Admin puede cancelar */}
          {['enviado', 'en_cotizacion'].includes(s.estado) && (isArea || isAdmin) && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCancelar(s) }}
              className="p-1 text-gray-500 hover:text-red-600"
              title="Cancelar solicitud"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Material</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isArea 
              ? 'Gestiona tus solicitudes de material' 
              : 'Gestiona las solicitudes de material de las áreas'}
          </p>
        </div>
        {canCreateSolicitud && (
          <Button onClick={handleCreate}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Solicitud
          </Button>
        )}
      </div>

      {/* Filtros rápidos */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries({
          todos: 'Todos',
          borrador: 'Borradores',
          enviado: 'Enviados',
          en_cotizacion: 'En Cotización',
          autorizado: 'Autorizados'
        }).map(([key, label]) => (
          <button
            key={key}
            className="px-3 py-1 text-sm rounded-full border border-gray-300 hover:bg-gray-50"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={solicitudes}
          keyExtractor={(s) => s.id}
          loading={loading}
          emptyMessage="No hay solicitudes registradas"
          onRowClick={handleView}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        title="Eliminar Solicitud" 
        size="sm"
      >
        <p className="text-gray-600">
          ¿Estás seguro de que deseas eliminar la solicitud <strong>{selectedSolicitud?.numero}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete} loading={submitting}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

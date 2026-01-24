import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  PaperAirplaneIcon,
  XCircleIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { procurementService, SolicitudMaterial } from '@/services/procurementService'

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

export default function SolicitudDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [solicitud, setSolicitud] = useState<SolicitudMaterial | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await procurementService.getSolicitud(parseInt(id))
        setSolicitud(data)
      } catch (error) {
        toast.error('Error al cargar la solicitud')
        navigate('/solicitudes')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, navigate])

  const handleEnviar = async () => {
    if (!solicitud) return
    setSubmitting(true)
    try {
      const updated = await procurementService.enviarSolicitud(solicitud.id)
      setSolicitud(updated)
      toast.success('Solicitud enviada correctamente')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelar = async () => {
    if (!solicitud) return
    setSubmitting(true)
    try {
      const updated = await procurementService.cancelarSolicitud(solicitud.id)
      setSolicitud(updated)
      toast.success('Solicitud cancelada')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al cancelar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '$0.00'
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!solicitud) {
    return <div>Solicitud no encontrada</div>
  }

  return (
    <div>
      <div className="mb-6">
        <button 
          onClick={() => navigate('/solicitudes')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Volver a solicitudes
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{solicitud.numero}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Creada el {formatDate(solicitud.created_at)} por {solicitud.created_by_name}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${estadoColors[solicitud.estado] || 'bg-gray-100 text-gray-800'}`}>
              {solicitud.estado_display}
            </span>
            
            {solicitud.urgente && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Urgente
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-wrap gap-2">
        {solicitud.estado === 'borrador' && (
          <>
            <Button onClick={() => navigate(`/solicitudes/${solicitud.id}/editar`)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button onClick={handleEnviar} loading={submitting}>
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              Enviar Solicitud
            </Button>
          </>
        )}
        
        {['enviado', 'en_cotizacion'].includes(solicitud.estado) && (
          <Button variant="danger" onClick={handleCancelar} loading={submitting}>
            <XCircleIcon className="h-4 w-4 mr-2" />
            Cancelar Solicitud
          </Button>
        )}
        
        <Button variant="secondary">
          <PrinterIcon className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Datos generales */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Datos Generales</h2>
        
        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Área Solicitante</dt>
            <dd className="mt-1 text-sm text-gray-900">{solicitud.area_name}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha de Solicitud</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(solicitud.fecha_solicitud)}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha Requerida</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {solicitud.fecha_requerida ? formatDate(solicitud.fecha_requerida) : '-'}
            </dd>
          </div>
          
          <div className="md:col-span-2 lg:col-span-3">
            <dt className="text-sm font-medium text-gray-500">Descripción</dt>
            <dd className="mt-1 text-sm text-gray-900">{solicitud.descripcion || '-'}</dd>
          </div>
          
          <div className="md:col-span-2 lg:col-span-3">
            <dt className="text-sm font-medium text-gray-500">Justificación</dt>
            <dd className="mt-1 text-sm text-gray-900">{solicitud.justificacion || '-'}</dd>
          </div>
        </dl>
      </div>

      {/* Detalle de materiales */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Materiales Solicitados</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">COG</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Est.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {solicitud.detalles.map((detalle, index) => (
                <tr key={detalle.id || index}>
                  <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>{detalle.concepto}</div>
                    {detalle.descripcion && (
                      <div className="text-xs text-gray-500">{detalle.descripcion}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{detalle.cog_codigo}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{detalle.cantidad}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{detalle.unidad}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(detalle.precio_estimado)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(detalle.subtotal_estimado || detalle.cantidad * detalle.precio_estimado)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  Total Estimado:
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                  {formatCurrency(solicitud.total_estimado)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

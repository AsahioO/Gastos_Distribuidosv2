import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { facturaService, Factura } from '../../services/facturaService'
import Button from '../../components/ui/Button'

const statusColors: Record<string, string> = {
  pendiente: 'bg-gray-100 text-gray-800',
  procesando: 'bg-blue-100 text-blue-800',
  procesada: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  distribuida: 'bg-purple-100 text-purple-800'
}

const statusLabels: Record<string, string> = {
  pendiente: 'Pendiente de procesar',
  procesando: 'Procesando...',
  procesada: 'Procesada correctamente',
  error: 'Error en procesamiento',
  distribuida: 'Distribuida a áreas'
}

export default function FacturaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      loadFactura()
    }
  }, [id])

  const loadFactura = async () => {
    try {
      setLoading(true)
      const data = await facturaService.getFactura(Number(id))
      setFactura(data)
    } catch (err) {
      setError('Error al cargar la factura')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReprocess = async () => {
    if (!factura || !confirm('¿Reprocesar esta factura?')) return

    try {
      setActionLoading(true)
      await facturaService.reprocessFactura(factura.id)
      await loadFactura()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Error al reprocesar')
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Factura no encontrada
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {factura.uuid_cfdi || 'Factura Pendiente'}
          </h1>
          <p className="text-gray-600">Factura CFDI</p>
        </div>
        <div className="flex gap-2">
          {factura.status === 'procesada' && (
            <Button onClick={() => navigate(`/facturas/${factura.id}/distribuir`)}>
              Distribuir Gastos
            </Button>
          )}
          {factura.status === 'error' && (
            <Button 
              onClick={handleReprocess} 
              loading={actionLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Reprocesar
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/facturas')}>
            Volver
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Error Message */}
      {factura.status === 'error' && factura.error_message && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Error de Procesamiento</h3>
          <p className="text-red-700">{factura.error_message}</p>
        </div>
      )}

      {/* Status Banner */}
      <div className={`p-4 rounded-lg mb-6 ${statusColors[factura.status]?.replace('text-', 'border-').replace('bg-', 'border-l-4 bg-')}`}>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[factura.status]}`}>
            {statusLabels[factura.status]}
          </span>
        </div>
      </div>

      {/* CFDI Information */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Información del CFDI</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm text-gray-500">UUID</label>
              <p className="font-mono text-sm">{factura.uuid_cfdi || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Folio</label>
              <p className="font-medium">{factura.folio || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Serie</label>
              <p className="font-medium">{factura.serie || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Fecha</label>
              <p className="font-medium">
                {factura.fecha ? new Date(factura.fecha).toLocaleString('es-MX') : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emisor / Receptor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Emisor</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">RFC</label>
                <p className="font-medium">{factura.rfc_emisor || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Nombre</label>
                <p className="font-medium">{factura.nombre_emisor || factura.proveedor_nombre}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Receptor</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">RFC</label>
                <p className="font-medium">{factura.rfc_receptor || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Nombre</label>
                <p className="font-medium">{factura.nombre_receptor || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Uso CFDI</label>
                <p className="font-medium">{factura.uso_cfdi || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amounts */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Importes</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            <div>
              <label className="text-sm text-gray-500">Subtotal</label>
              <p className="font-medium">${Number(factura.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Descuento</label>
              <p className="font-medium">${Number(factura.descuento).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">IVA</label>
              <p className="font-medium">${Number(factura.iva).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">ISR Retenido</label>
              <p className="font-medium">${Number(factura.isr).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">IVA Retenido</label>
              <p className="font-medium">${Number(factura.iva_retenido).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <label className="text-sm text-blue-600">Total</label>
              <p className="font-bold text-xl text-blue-800">
                ${Number(factura.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conceptos */}
      {factura.conceptos && factura.conceptos.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Conceptos ({factura.conceptos.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clave</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unidad</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P. Unitario</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Importe</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {factura.conceptos.map((concepto) => (
                  <tr key={concepto.id}>
                    <td className="px-4 py-4 text-sm text-gray-600">{concepto.clave_prod_serv}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-md truncate">{concepto.descripcion}</td>
                    <td className="px-4 py-4 text-sm text-center">{concepto.cantidad}</td>
                    <td className="px-4 py-4 text-sm text-center">{concepto.unidad || concepto.clave_unidad}</td>
                    <td className="px-4 py-4 text-sm text-right">
                      ${Number(concepto.valor_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium">
                      ${Number(concepto.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Distribuciones */}
      {factura.distribuciones && factura.distribuciones.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Distribución de Gastos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">%</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {factura.distribuciones.map((dist) => (
                  <tr key={dist.id}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{dist.area_nombre}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">{dist.concepto_descripcion}</td>
                    <td className="px-4 py-4 text-sm text-center">{dist.porcentaje}%</td>
                    <td className="px-4 py-4 text-sm text-right font-medium">
                      ${Number(dist.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{dist.notas || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Files */}
      <div className="mt-6 flex gap-4">
        {factura.xml_file && (
          <a
            href={factura.xml_file}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            📄 Descargar XML
          </a>
        )}
        {factura.pdf_file && (
          <a
            href={factura.pdf_file}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            📑 Ver PDF
          </a>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Button, Input, Select } from '@/components/ui'
import { procurementService, Cog, CreateSolicitudData } from '@/services/procurementService'
import { areaService, Area } from '@/services/areaService'

interface DetalleForm {
  concepto: string
  descripcion: string
  cantidad: number
  unidad: string
  cog: number
  precio_estimado: number
  notas: string
}

interface SolicitudForm {
  area: number
  fecha_solicitud: string
  descripcion: string
  justificacion: string
  urgente: boolean
  fecha_requerida: string
  detalles: DetalleForm[]
}

export default function SolicitudFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [areas, setAreas] = useState<Area[]>([])
  const [cogs, setCogs] = useState<Cog[]>([])
  const [cogSearch] = useState('')

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<SolicitudForm>({
    defaultValues: {
      area: 0,
      fecha_solicitud: new Date().toISOString().split('T')[0],
      descripcion: '',
      justificacion: '',
      urgente: false,
      fecha_requerida: '',
      detalles: [{ concepto: '', descripcion: '', cantidad: 1, unidad: 'Pieza', cog: 0, precio_estimado: 0, notas: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'detalles'
  })

  const watchDetalles = watch('detalles')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [areasData, cogsData] = await Promise.all([
          areaService.getAreas(),
          procurementService.getCogs()
        ])
        setAreas(areasData)
        setCogs(cogsData)

        if (isEditing && id) {
          const solicitud = await procurementService.getSolicitud(parseInt(id))
          setValue('area', solicitud.area)
          setValue('fecha_solicitud', solicitud.fecha_solicitud)
          setValue('descripcion', solicitud.descripcion)
          setValue('justificacion', solicitud.justificacion)
          setValue('urgente', solicitud.urgente)
          setValue('fecha_requerida', solicitud.fecha_requerida || '')
          setValue('detalles', solicitud.detalles.map(d => ({
            concepto: d.concepto,
            descripcion: d.descripcion,
            cantidad: d.cantidad,
            unidad: d.unidad,
            cog: d.cog,
            precio_estimado: d.precio_estimado,
            notas: d.notas
          })))
        }
      } catch (error) {
        toast.error('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, isEditing, setValue])

  const onSubmit = async (data: SolicitudForm) => {
    if (data.detalles.length === 0) {
      toast.error('Agrega al menos un material a la solicitud')
      return
    }

    setSubmitting(true)
    try {
      const payload: CreateSolicitudData = {
        ...data,
        fecha_requerida: data.fecha_requerida || null,
        detalles: data.detalles.map(d => ({
          concepto: d.concepto,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          unidad: d.unidad,
          cog: d.cog,
          precio_estimado: d.precio_estimado,
          notas: d.notas
        }))
      }

      if (isEditing && id) {
        await procurementService.updateSolicitud(parseInt(id), payload)
        toast.success('Solicitud actualizada correctamente')
      } else {
        await procurementService.createSolicitud(payload)
        toast.success('Solicitud creada correctamente')
      }
      navigate('/solicitudes')
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.message ||
                       Object.values(error.response?.data || {})[0] ||
                       'Error al guardar la solicitud'
      toast.error(String(errorMsg))
    } finally {
      setSubmitting(false)
    }
  }

  const addDetalle = () => {
    append({ concepto: '', descripcion: '', cantidad: 1, unidad: 'Pieza', cog: 0, precio_estimado: 0, notas: '' })
  }

  const calculateTotal = () => {
    return watchDetalles.reduce((sum, d) => sum + (d.cantidad * d.precio_estimado), 0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
  }

  const filteredCogs = cogSearch 
    ? (Array.isArray(cogs) ? cogs : []).filter(c => 
        c.codigo.toLowerCase().includes(cogSearch.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(cogSearch.toLowerCase())
      )
    : (Array.isArray(cogs) ? cogs : [])

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
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Solicitud' : 'Nueva Solicitud de Material'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos generales */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Datos Generales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Área solicitante *"
              options={areas.map(a => ({ value: a.id, label: a.nombre }))}
              placeholder="Selecciona un área"
              {...register('area', { required: 'El área es requerida', valueAsNumber: true })}
              error={errors.area?.message}
            />

            <Input
              label="Fecha de solicitud *"
              type="date"
              {...register('fecha_solicitud', { required: 'La fecha es requerida' })}
              error={errors.fecha_solicitud?.message}
            />

            <Input
              label="Fecha requerida"
              type="date"
              {...register('fecha_requerida')}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Input
              label="Descripción"
              placeholder="Descripción breve de la solicitud"
              {...register('descripcion')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Justificación</label>
              <textarea
                {...register('justificacion')}
                rows={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Justificación de la solicitud de material"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('urgente')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Marcar como urgente</span>
            </label>
          </div>
        </div>

        {/* Detalle de materiales */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Materiales Solicitados</h2>
            <Button type="button" size="sm" onClick={addDetalle}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Agregar Material
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay materiales agregados. Haz clic en "Agregar Material" para comenzar.
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-500">Material #{index + 1}</span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2">
                      <Input
                        label="Concepto *"
                        placeholder="Nombre del material"
                        {...register(`detalles.${index}.concepto`, { required: 'Requerido' })}
                        error={errors.detalles?.[index]?.concepto?.message}
                      />
                    </div>

                    <Input
                      label="Cantidad *"
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...register(`detalles.${index}.cantidad`, { 
                        required: 'Requerido', 
                        valueAsNumber: true,
                        min: { value: 0.01, message: 'Mínimo 0.01' }
                      })}
                      error={errors.detalles?.[index]?.cantidad?.message}
                    />

                    <Input
                      label="Unidad *"
                      placeholder="Pieza, Kg, Lt..."
                      {...register(`detalles.${index}.unidad`, { required: 'Requerido' })}
                      error={errors.detalles?.[index]?.unidad?.message}
                    />

                    <Select
                      label="COG *"
                      options={filteredCogs.map(c => ({ value: c.id, label: `${c.codigo} - ${c.descripcion.substring(0, 50)}...` }))}
                      placeholder="Selecciona COG"
                      {...register(`detalles.${index}.cog`, { required: 'Requerido', valueAsNumber: true })}
                      error={errors.detalles?.[index]?.cog?.message}
                    />

                    <Input
                      label="Precio estimado"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`detalles.${index}.precio_estimado`, { valueAsNumber: true })}
                    />

                    <div className="lg:col-span-2">
                      <Input
                        label="Descripción adicional"
                        placeholder="Especificaciones del material"
                        {...register(`detalles.${index}.descripcion`)}
                      />
                    </div>
                  </div>

                  <div className="mt-2 text-right text-sm text-gray-500">
                    Subtotal: {formatCurrency((watchDetalles[index]?.cantidad || 0) * (watchDetalles[index]?.precio_estimado || 0))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {fields.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-right">
              <span className="text-lg font-medium text-gray-900">
                Total Estimado: {formatCurrency(calculateTotal())}
              </span>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/solicitudes')}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditing ? 'Actualizar Solicitud' : 'Crear Solicitud'}
          </Button>
        </div>
      </form>
    </div>
  )
}

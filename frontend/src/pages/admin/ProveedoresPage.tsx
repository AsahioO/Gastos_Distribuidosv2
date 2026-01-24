import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button, Input, Modal, Table } from '@/components/ui'
import { proveedorService, Proveedor, CreateProveedorData } from '@/services/proveedorService'
import { useAuthStore } from '@/stores/authStore'
import { useForm } from 'react-hook-form'

export default function ProveedoresPage() {
  const { user } = useAuthStore()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateProveedorData>()

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await proveedorService.getProveedores()
      setProveedores(data)
    } catch (error) {
      toast.error('Error al cargar los proveedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openModal = (proveedor?: Proveedor) => {
    if (proveedor) {
      setEditingProveedor(proveedor)
      reset({
        razon_social: proveedor.razon_social,
        nombre_comercial: proveedor.nombre_comercial || '',
        rfc: proveedor.rfc,
        email: proveedor.email,
        telefono: proveedor.telefono || '',
        direccion: proveedor.direccion || '',
        ciudad: proveedor.ciudad || '',
        estado: proveedor.estado || '',
        contacto_nombre: proveedor.contacto_nombre || '',
        giro: proveedor.giro || ''
      })
    } else {
      setEditingProveedor(null)
      reset({
        razon_social: '',
        nombre_comercial: '',
        rfc: '',
        email: '',
        telefono: '',
        direccion: '',
        ciudad: '',
        estado: '',
        contacto_nombre: '',
        giro: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProveedor(null)
    reset()
  }

  const onSubmit = async (data: CreateProveedorData) => {
    setSubmitting(true)
    try {
      if (editingProveedor) {
        await proveedorService.updateProveedor(editingProveedor.id, data)
        toast.success('Proveedor actualizado correctamente')
      } else {
        await proveedorService.createProveedor(data)
        toast.success('Proveedor creado correctamente')
      }
      closeModal()
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al guardar el proveedor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (proveedor: Proveedor) => {
    if (!confirm(`¿Está seguro de eliminar el proveedor "${proveedor.razon_social}"?`)) return
    
    try {
      await proveedorService.deleteProveedor(proveedor.id)
      toast.success('Proveedor eliminado correctamente')
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al eliminar el proveedor')
    }
  }

  const columns = [
    { key: 'razon_social', header: 'Razón Social' },
    { key: 'rfc', header: 'RFC' },
    { key: 'email', header: 'Email' },
    { key: 'telefono', header: 'Teléfono' },
    { key: 'ciudad', header: 'Ciudad' },
    { 
      key: 'is_active', 
      header: 'Estado',
      render: (p: Proveedor) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {p.is_active ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (p: Proveedor) => (
        <div className="flex space-x-1">
          <button
            onClick={(e) => { e.stopPropagation(); openModal(p) }}
            className="p-1 text-gray-500 hover:text-primary-600"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {['admin'].includes(user?.role || '') && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(p) }}
              className="p-1 text-gray-500 hover:text-red-600"
              title="Eliminar"
            >
              <TrashIcon className="h-5 w-5" />
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
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los proveedores del sistema
          </p>
        </div>
        {['admin', 'adquisiciones'].includes(user?.role || '') && (
          <Button onClick={() => openModal()}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={proveedores}
          keyExtractor={(p) => p.id}
          loading={loading}
          emptyMessage="No hay proveedores registrados"
        />
      </div>

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Razón Social *"
              error={errors.razon_social?.message}
              {...register('razon_social', { required: 'La razón social es requerida' })}
            />
            <Input
              label="Nombre Comercial"
              {...register('nombre_comercial')}
            />
            <Input
              label="RFC *"
              error={errors.rfc?.message}
              {...register('rfc', { 
                required: 'El RFC es requerido',
                minLength: { value: 12, message: 'El RFC debe tener al menos 12 caracteres' }
              })}
            />
            <Input
              type="email"
              label="Email *"
              error={errors.email?.message}
              {...register('email', { 
                required: 'El email es requerido',
                pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' }
              })}
            />
            <Input
              label="Teléfono"
              {...register('telefono')}
            />
            <Input
              label="Giro"
              placeholder="Ej: Papelería, Cómputo..."
              {...register('giro')}
            />
            <Input
              label="Ciudad"
              {...register('ciudad')}
            />
            <Input
              label="Estado"
              {...register('estado')}
            />
          </div>
          
          <Input
            label="Dirección"
            {...register('direccion')}
          />
          
          <Input
            label="Nombre de Contacto"
            {...register('contacto_nombre')}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {editingProveedor ? 'Guardar Cambios' : 'Crear Proveedor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

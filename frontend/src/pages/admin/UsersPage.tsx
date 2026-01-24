import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button, Table, Modal, Input, Select } from '@/components/ui'
import { userService, Role, CreateUserData } from '@/services/userService'
import type { User } from '@/stores/authStore'
import { useForm } from 'react-hook-form'

export default function UsersPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserData>()

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getUsers(),
        userService.getRoles()
      ])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (error) {
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = () => {
    setSelectedUser(null)
    reset({
      email: '',
      username: '',
      full_name: '',
      phone: '',
      role: undefined,
      password: '',
      password_confirm: ''
    })
    setModalOpen(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setDeleteModalOpen(true)
  }

  const onSubmit = async (data: CreateUserData) => {
    setSubmitting(true)
    try {
      await userService.createUser(data)
      toast.success('Usuario creado correctamente')
      setModalOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al crear usuario')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      await userService.deleteUser(selectedUser.id)
      toast.success('Usuario eliminado correctamente')
      setDeleteModalOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al eliminar usuario')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'username', header: 'Usuario' },
    { key: 'email', header: 'Correo' },
    { key: 'full_name', header: 'Nombre Completo' },
    { 
      key: 'role', 
      header: 'Rol',
      render: (user: User) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
          {user.role_display || user.role}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (user: User) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/usuarios/${user.id}`) }}
            className="text-primary-600 hover:text-primary-900"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(user) }}
            className="text-red-600 hover:text-red-900"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={users}
          keyExtractor={(user) => user.id}
          loading={loading}
          emptyMessage="No hay usuarios registrados"
        />
      </div>

      {/* Create User Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Usuario" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Usuario"
              {...register('username', { required: 'El usuario es requerido' })}
              error={errors.username?.message}
            />
            <Input
              label="Correo electrónico"
              type="email"
              {...register('email', { 
                required: 'El correo es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Correo inválido'
                }
              })}
              error={errors.email?.message}
            />
            <Input
              label="Nombre completo"
              {...register('full_name', { required: 'El nombre es requerido' })}
              error={errors.full_name?.message}
            />
            <Input
              label="Teléfono"
              {...register('phone')}
            />
            <Select
              label="Rol"
              options={roles.map(r => ({ value: r.id, label: r.description || r.name }))}
              placeholder="Selecciona un rol"
              {...register('role', { required: 'El rol es requerido', valueAsNumber: true })}
              error={errors.role?.message}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contraseña"
              type="password"
              {...register('password', { 
                required: 'La contraseña es requerida',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' }
              })}
              error={errors.password?.message}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              {...register('password_confirm', { required: 'Confirma la contraseña' })}
              error={errors.password_confirm?.message}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Eliminar Usuario" size="sm">
        <p className="text-gray-600">
          ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser?.full_name}</strong>?
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

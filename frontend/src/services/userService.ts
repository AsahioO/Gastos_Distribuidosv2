import api from './api'
import type { User } from '@/stores/authStore'

export interface CreateUserData {
  email: string
  username: string
  full_name: string
  phone?: string
  role: number
  password: string
  password_confirm: string
}

export interface UpdateUserData {
  full_name?: string
  phone?: string
  avatar?: string
}

export interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
  is_active: boolean
}

// Helper para manejar respuestas paginadas o arrays directos
const extractData = <T>(data: T[] | { results: T[] }): T[] => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && 'results' in data) return data.results
  return []
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/auth/users/')
    return extractData(response.data)
  },

  getUser: async (id: number): Promise<User> => {
    const response = await api.get(`/auth/users/${id}/`)
    return response.data
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await api.post('/auth/users/', data)
    return response.data
  },

  updateUser: async (id: number, data: UpdateUserData): Promise<User> => {
    const response = await api.patch(`/auth/users/${id}/`, data)
    return response.data
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/auth/users/${id}/`)
  },

  toggleUserStatus: async (id: number): Promise<User> => {
    const response = await api.post(`/auth/users/${id}/toggle_active/`)
    return response.data
  },

  getRoles: async (): Promise<Role[]> => {
    const response = await api.get('/auth/roles/')
    return extractData(response.data)
  },
}

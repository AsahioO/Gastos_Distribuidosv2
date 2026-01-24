import api from './api'

export interface Area {
  id: number
  nombre: string
  codigo: string
  descripcion: string
  responsable: number | null
  responsable_nombre?: string
  presupuesto_anual: string
  presupuesto_disponible: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateAreaData {
  nombre: string
  codigo: string
  descripcion?: string
  responsable?: number
  presupuesto_anual?: string
}

export interface UpdateAreaData {
  nombre?: string
  codigo?: string
  descripcion?: string
  responsable?: number
  presupuesto_anual?: string
  is_active?: boolean
}

// Helper para manejar respuestas paginadas o arrays directos
const extractData = <T>(data: T[] | { results: T[] }): T[] => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && 'results' in data) return data.results
  return []
}

export const areaService = {
  getAreas: async (): Promise<Area[]> => {
    const response = await api.get('/areas/')
    return extractData(response.data)
  },

  getArea: async (id: number): Promise<Area> => {
    const response = await api.get(`/areas/${id}/`)
    return response.data
  },

  createArea: async (data: CreateAreaData): Promise<Area> => {
    const response = await api.post('/areas/', data)
    return response.data
  },

  updateArea: async (id: number, data: UpdateAreaData): Promise<Area> => {
    const response = await api.patch(`/areas/${id}/`, data)
    return response.data
  },

  deleteArea: async (id: number): Promise<void> => {
    await api.delete(`/areas/${id}/`)
  },
}

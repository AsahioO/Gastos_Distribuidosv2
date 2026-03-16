import api from './api'

export interface Company {
  id: number
  rfc: string
  razon_social: string
  nombre_comercial: string
  calle: string
  numero_exterior: string
  numero_interior: string
  colonia: string
  municipio: string
  estado: string
  codigo_postal: string
  direccion_completa: string
  telefono: string
  email: string
  logo: string | null
  membrete: string | null
  pie_pagina: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

const extractData = <T>(data: T[] | { results: T[] }): T[] => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && 'results' in data) return data.results
  return []
}

export const companyService = {
  getCompanies: async (): Promise<Company[]> => {
    const response = await api.get('/companies/empresas/')
    return extractData(response.data)
  },

  getCompany: async (id: number): Promise<Company> => {
    const response = await api.get(`/companies/empresas/${id}/`)
    return response.data
  },

  updateCompany: async (id: number, data: Partial<Company> | FormData): Promise<Company> => {
    // Determine content type based on data type
    const isFormData = data instanceof FormData
    const response = await api.patch(`/companies/empresas/${id}/`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    })
    return response.data
  },
}

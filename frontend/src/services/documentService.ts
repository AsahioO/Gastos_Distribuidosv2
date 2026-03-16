import api from './api'

export const documentService = {
  downloadSolicitudPdf: async (id: number, numero: string): Promise<void> => {
    const response = await api.get(`/procurement/solicitudes/${id}/generar_pdf/`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `solicitud_${numero}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  downloadOrdenCompraPdf: async (id: number, numero: string): Promise<void> => {
    const response = await api.get(`/orders/${id}/generar_pdf/`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `orden_${numero}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  downloadAutorizacionPdf: async (id: number, referencia: string): Promise<void> => {
    const response = await api.get(`/orders/autorizaciones/${id}/generar_pdf/`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `autorizacion_${referencia}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}

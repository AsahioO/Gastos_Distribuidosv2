import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import PageHeader from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { companyService, Company } from '@/services/companyService'

export default function EmpresaConfigPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [membreteFile, setMembreteFile] = useState<File | null>(null)
  const [piePaginaFile, setPiePaginaFile] = useState<File | null>(null)

  useEffect(() => {
    fetchCompany()
  }, [])

  const fetchCompany = async () => {
    try {
      setLoading(true)
      const data = await companyService.getCompanies()
      if (data && data.length > 0) {
        setCompany(data[0])
      }
    } catch (error) {
      console.error('Error fetching company:', error)
      toast.error('Error al cargar la configuración de la empresa')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!company) return

    try {
      setSaving(true)
      
      let updateData: Partial<Company> | FormData = {}

      if (logoFile || membreteFile || piePaginaFile) {
        // Use FormData if there are files
        const formData = new FormData()
        if (logoFile) formData.append('logo', logoFile)
        if (membreteFile) formData.append('membrete', membreteFile)
        if (piePaginaFile) formData.append('pie_pagina', piePaginaFile)

        updateData = formData
      } else {
        // Nothing to update in this basic page if no files uploaded
        toast.success('Configuración guardada (sin cambios)')
        setSaving(false)
        return
      }

      await companyService.updateCompany(company.id, updateData)
      toast.success('Configuración actualizada correctamente')
      
      // Reset file states and reload company data
      setLogoFile(null)
      setMembreteFile(null)
      setPiePaginaFile(null)
      await fetchCompany()
    } catch (error) {
      console.error('Error saving company:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const renderFilePreview = (
    currentUrl: string | null,
    selectedFile: File | null,
    label: string,
    setFile: (file: File | null) => void,
    accept: string = 'image/*'
  ) => {
    const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : currentUrl

    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative group min-h-[150px]">
          {previewUrl ? (
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <img 
                src={previewUrl} 
                alt={label} 
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm">Haz clic o arrastra para cambiar</p>
                <input
                  type="file"
                  accept={accept}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-center flex flex-col items-center justify-center w-full h-full absolute inset-0">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                  <span>Sube un archivo</span>
                  <input 
                    type="file" 
                    className="sr-only" 
                    accept={accept}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="pl-1">o arrastra y suelta</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 5MB</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
        No se encontró información de la empresa. Por favor configure una empresa en el sistema.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Configuración de Documentos (PDFs)" 
        subtitle={`Empresa: ${company.razon_social}`}
      />

      <Card>
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                 <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Logotipo de la Empresa</h3>
                 <p className="text-sm text-gray-500 mb-4">Aparecerá en reportes y formato estándar de las vistas.</p>
                 {renderFilePreview(company.logo, logoFile, "Logo Principal", setLogoFile)}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-200">
             <div className="space-y-2">
                 <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Membrete de PDF</h3>
                 <p className="text-sm text-gray-500 mb-4">Imagen para la cabecera (Header) de los documentos oficiales (solicitudes, órdenes de compra).</p>
                 {renderFilePreview(company.membrete, membreteFile, "Imagen de Membrete", setMembreteFile)}
             </div>
             <div className="space-y-2">
                 <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Pie de Página de PDF</h3>
                 <p className="text-sm text-gray-500 mb-4">Imagen para el footer de los documentos oficiales.</p>
                 {renderFilePreview(company.pie_pagina, piePaginaFile, "Imagen de Pie de Página", setPiePaginaFile)}
             </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
             <div className="text-sm text-gray-500">
                 <p>Nota: Los firmantes de cada documento se configuran desde el panel de administración central <a href="/admin/companies/company/" target="_blank" className="text-primary-600 hover:underline">Ir a Django Admin</a>.</p>
             </div>
             <Button
                onClick={handleSave}
                disabled={saving || (!logoFile && !membreteFile && !piePaginaFile)}
             >
                {saving ? 'Guardando...' : 'Guardar Imágenes'}
             </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DocumentTemplate, Client } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export default function NewDocumentPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(z.record(z.string())),
    defaultValues: {},
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // Buscar templates
        const { data: templatesData } = await supabase
          .from('document_templates')
          .select('*')
          .eq('is_active', true)

        // Buscar clientes
        const { data: clientsData } = await supabase
          .from('clients')
          .select('*')

        setTemplates(templatesData || [])
        setClients(clientsData || [])

        // Se tem template no query param, selecionar
        const templateId = searchParams.get('template')
        if (templateId && templatesData) {
          const template = templatesData.find((t) => t.id === templateId)
          if (template) {
            setSelectedTemplate(template)
          }
        }
      } catch (err) {
        console.error('[v0] Error loading data:', err)
        setError('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [searchParams, supabase])

  async function handleSaveAsDraft(formData: Record<string, any>) {
    if (!selectedTemplate) {
      setError('Selecione um modelo')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('generated_documents').insert({
        template_id: selectedTemplate.id,
        client_id: selectedClient?.id || null,
        process_id: null,
        document_number: 'v1',
        filled_data: formData,
        status: 'rascunho',
        docx_url: null,
        pdf_url: null,
      })

      if (insertError) throw insertError

      router.push('/dashboard/documents')
    } catch (err: any) {
      console.error('[v0] Error saving draft:', err)
      setError(err.message || 'Erro ao salvar rascunho')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFinalize(formData: Record<string, any>) {
    if (!selectedTemplate) {
      setError('Selecione um modelo')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('generated_documents').insert({
        template_id: selectedTemplate.id,
        client_id: selectedClient?.id || null,
        process_id: null,
        document_number: 'v1',
        filled_data: formData,
        status: 'finalizado',
        docx_url: null,
        pdf_url: null,
      })

      if (insertError) throw insertError

      router.push('/dashboard/documents')
    } catch (err: any) {
      console.error('[v0] Error finalizing:', err)
      setError(err.message || 'Erro ao finalizar documento')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerar Novo Documento</h1>
        <p className="mt-2 text-muted-foreground">
          Preencha o formulário para gerar um novo documento
        </p>
      </div>

      <form
        onSubmit={handleSubmit((data) =>
          handleFinalize(data)
        )}
        className="space-y-6"
      >
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Selecione um modelo *</Label>
            <Select value={selectedTemplate?.id || ''} onValueChange={(id) => {
              const template = templates.find((t) => t.id === id)
              setSelectedTemplate(template || null)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um modelo" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente (opcional)</Label>
            <Select value={selectedClient?.id || ''} onValueChange={(id) => {
              const client = clients.find((c) => c.id === id)
              setSelectedClient(client || null)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Fields */}
          {selectedTemplate && Object.keys(selectedTemplate.placeholder_json).length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Preencha os campos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedTemplate.placeholder_json).map(([key, field]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {field.display_label}
                      {field.required && ' *'}
                    </Label>
                    {field.field_type === 'textarea' ? (
                      <Textarea
                        id={key}
                        placeholder={field.display_label}
                        {...register(key, {
                          required: field.required ? `${field.display_label} é obrigatório` : false,
                        })}
                        className={errors[key] ? 'border-destructive' : ''}
                      />
                    ) : (
                      <Input
                        id={key}
                        type={field.field_type === 'date' ? 'date' : 'text'}
                        placeholder={field.display_label}
                        {...register(key, {
                          required: field.required ? `${field.display_label} é obrigatório` : false,
                        })}
                        className={errors[key] ? 'border-destructive' : ''}
                      />
                    )}
                    {errors[key] && (
                      <p className="text-sm text-destructive">{String(errors[key]?.message)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit((data) => handleSaveAsDraft(data))}
              disabled={submitting || !selectedTemplate}
            >
              {submitting ? 'Salvando...' : 'Salvar como Rascunho'}
            </Button>
            <Button type="submit" disabled={submitting || !selectedTemplate}>
              {submitting ? 'Finalizando...' : 'Finalizar Documento'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

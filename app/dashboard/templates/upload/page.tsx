'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateUpload } from '@/components/template-upload'
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
import { PlaceholderField } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const categories = ['Cível', 'Previdenciário', 'Administrativo', 'Licitações', 'Trabalhista']

export default function UploadTemplatePage() {
  const [templateName, setTemplateName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [placeholders, setPlaceholders] = useState<Record<string, PlaceholderField> | null>(null)
  const [previewText, setPreviewText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!templateName || !category || !placeholders) {
      setError('Preencha todos os campos e processe o arquivo')
      return
    }

    setLoading(true)

    try {
      const { error: insertError } = await supabase.from('document_templates').insert({
        name: templateName,
        category: category as any,
        description: description || null,
        tags: [],
        original_docx_url: '', // Será implementado com storage
        placeholder_json: placeholders,
        preview_text: previewText,
        is_active: true,
      })

      if (insertError) throw insertError

      router.push('/dashboard/templates')
    } catch (err: any) {
      console.error('[v0] Error creating template:', err)
      setError(err.message || 'Erro ao salvar template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload de Modelo</h1>
        <p className="mt-2 text-muted-foreground">
          Faça upload de um arquivo .docx com placeholders {{CAMPO}}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          {/* File Upload */}
          <TemplateUpload
            onExtract={(ph, text) => {
              setPlaceholders(ph)
              setPreviewText(text)
            }}
          />

          {/* Template Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Informações do Modelo</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Modelo *</Label>
              <Input
                id="name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Petição Inicial"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={category} onValueChange={setCategory} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do modelo"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading || !placeholders}>
              {loading ? 'Salvando...' : 'Salvar Modelo'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

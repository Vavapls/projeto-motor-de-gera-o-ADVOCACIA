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

// Bucket privado criado no Supabase Storage (ver migration 004_storage_policy.sql)
const STORAGE_BUCKET = 'document-templates'

export default function UploadTemplatePage() {
  const [templateName, setTemplateName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [placeholders, setPlaceholders] = useState<Record<string, PlaceholderField> | null>(null)
  const [previewText, setPreviewText] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!templateName || !category || !placeholders || !pendingFile) {
      setError('Preencha todos os campos e processe o arquivo')
      return
    }

    setLoading(true)

    try {
      // 1. Obter usuário autenticado (necessário para o path do bucket)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada — faça login novamente')

      // 2. Upload do .docx para o bucket PRIVADO
      //    Path: {user_id}/{timestamp}_{nome_original}
      //    O bucket é privado: só usuários autenticados com a policy correta acessam.
      const ext = pendingFile.name.split('.').pop() ?? 'docx'
      const safeName = templateName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
      const storagePath = `${user.id}/${Date.now()}_${safeName}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, pendingFile, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: false,
        })

      if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`)

      // 3. Salvar registro no banco com o path real (não a URL pública — é privado)
      //    A URL de download será gerada on-demand com createSignedUrl()
      const { error: insertError } = await supabase.from('document_templates').insert({
        name: templateName,
        category: category as any,
        description: description || null,
        tags: [],
        original_docx_url: storagePath, // path no bucket, não URL pública
        placeholder_json: placeholders,
        preview_text: previewText,
        is_active: true,
      })

      if (insertError) throw insertError

      router.push('/dashboard/templates')
    } catch (err: any) {
      console.error('[upload] Error:', err)
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
          Faça upload de um arquivo .docx com placeholders {'{'}{'{'} CAMPO {'}'}{'}'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          {/* File Upload */}
          <TemplateUpload
            onExtract={(ph, text, file) => {
              setPlaceholders(ph)
              setPreviewText(text)
              setPendingFile(file)
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
            <Button type="submit" disabled={loading || !placeholders || !pendingFile}>
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

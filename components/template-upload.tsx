'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { extractPlaceholders, isValidDocx } from '@/lib/utils/docx-parser'
import { PlaceholderField } from '@/lib/types'

interface TemplateUploadProps {
  onExtract?: (placeholders: Record<string, PlaceholderField>, previewText: string) => void
}

export function TemplateUpload({ onExtract }: TemplateUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placeholders, setPlaceholders] = useState<Record<string, PlaceholderField> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setPlaceholders(null)

    // Validar arquivo
    const isValid = await isValidDocx(selectedFile)
    if (!isValid) {
      setError('Por favor, selecione um arquivo .docx válido')
      return
    }

    setFile(selectedFile)
  }

  async function handleExtract() {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      // Converter arquivo para base64
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const binaryString = String.fromCharCode(...uint8Array)
      const base64 = btoa(binaryString)

      // Fazer parsing
      const { placeholders: extracted, previewText } = await extractPlaceholders(base64)

      if (Object.keys(extracted).length === 0) {
        setError('Nenhum placeholder encontrado. Use o formato {{NOME_CAMPO}} no documento.')
        return
      }

      setPlaceholders(extracted)
      onExtract?.(extracted, previewText)
    } catch (err: any) {
      console.error('[v0] Error extracting placeholders:', err)
      setError(err.message || 'Erro ao processar arquivo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="docx-file">Arquivo .docx</Label>
        <div className="flex gap-2">
          <Input
            id="docx-file"
            type="file"
            accept=".docx"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleExtract}
            disabled={!file || loading}
            variant="outline"
          >
            {loading ? 'Analisando...' : 'Analisar'}
          </Button>
        </div>
        {file && <p className="text-sm text-muted-foreground">Arquivo: {file.name}</p>}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {placeholders && Object.keys(placeholders).length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground mb-3">
              {Object.keys(placeholders).length} campo(s) detectado(s)
            </p>
            <div className="space-y-2">
              {Object.entries(placeholders).map(([key, field]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">{key}</p>
                    <p className="text-xs text-muted-foreground">{field.display_label}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {field.field_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {field.occurrences}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
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
import type { Lawyer, Genero } from '@/lib/types'
import { upsertLawyerAction, deleteLawyerAction } from '@/app/actions/lawyers'

const generoOptions: { value: Genero; label: string }[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
]

const civilStatusOptions = ['solteiro', 'casada', 'divorciado', 'viúvo', 'casado', 'solteira', 'divorciada', 'viúva']

interface LawyersManagerProps {
  initialLawyers: Lawyer[]
}

const emptyForm = {
  full_name: '',
  genero: 'M' as Genero,
  nacionalidade: 'brasileiro',
  estado_civil: '',
  oab: '',
  is_default: false,
}

export function LawyersManager({ initialLawyers }: LawyersManagerProps) {
  const [lawyers, setLawyers] = useState<Lawyer[]>(initialLawyers)
  const [editing, setEditing] = useState<string | null>(null) // id ou 'new'
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startNew() {
    setForm(emptyForm)
    setEditing('new')
    setError(null)
  }

  function startEdit(l: Lawyer) {
    setForm({
      full_name: l.full_name,
      genero: l.genero,
      nacionalidade: l.nacionalidade,
      estado_civil: l.estado_civil ?? '',
      oab: l.oab,
      is_default: l.is_default,
    })
    setEditing(l.id)
    setError(null)
  }

  function cancel() {
    setEditing(null)
    setError(null)
  }

  async function handleSave() {
    if (!form.full_name.trim() || !form.oab.trim()) {
      setError('Nome e OAB são obrigatórios')
      return
    }
    setSaving(true)
    setError(null)

    const payload: any = {
      ...form,
      estado_civil: form.estado_civil || null,
      ...(editing !== 'new' ? { id: editing! } : {}),
    }

    const result = await upsertLawyerAction(payload)
    setSaving(false)

    if (!result.success) {
      setError(result.error ?? 'Erro ao salvar')
      return
    }

    if (editing === 'new') {
      setLawyers((prev) => {
        const base = result.data!.is_default
          ? prev.map((l) => ({ ...l, is_default: false }))
          : prev
        return [...base, result.data!]
      })
    } else {
      setLawyers((prev) =>
        prev.map((l) => {
          if (result.data!.is_default && l.id !== result.data!.id) {
            return { ...l, is_default: false }
          }
          return l.id === result.data!.id ? result.data! : l
        })
      )
    }
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este advogado?')) return
    const result = await deleteLawyerAction(id)
    if (result.success) {
      setLawyers((prev) => prev.filter((l) => l.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Advogados</h3>
        {editing === null && (
          <Button type="button" size="sm" onClick={startNew}>
            + Adicionar advogado
          </Button>
        )}
      </div>

      {/* Lista */}
      {lawyers.length === 0 && editing === null && (
        <p className="text-sm text-muted-foreground">
          Nenhum advogado cadastrado. Adicione um para usar nos documentos.
        </p>
      )}

      <div className="space-y-2">
        {lawyers.map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {l.full_name}
                {l.is_default && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-normal">
                    padrão
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{l.oab}</p>
            </div>
            {editing === l.id ? null : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(l)}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(l.id)}
                  className="text-destructive hover:text-destructive"
                >
                  Remover
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Formulário inline */}
      {editing !== null && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
          <h4 className="text-sm font-medium text-foreground">
            {editing === 'new' ? 'Novo advogado' : 'Editar advogado'}
          </h4>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Dr. Francisco Gomes"
              />
            </div>

            <div className="space-y-2">
              <Label>OAB *</Label>
              <Input
                value={form.oab}
                onChange={(e) => setForm({ ...form, oab: e.target.value })}
                placeholder="OAB/RO 3529"
              />
            </div>

            <div className="space-y-2">
              <Label>Gênero</Label>
              <Select
                value={form.genero}
                onValueChange={(v) => setForm({ ...form, genero: v as Genero })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generoOptions.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nacionalidade</Label>
              <Input
                value={form.nacionalidade}
                onChange={(e) => setForm({ ...form, nacionalidade: e.target.value })}
                placeholder="brasileiro"
              />
            </div>

            <div className="space-y-2">
              <Label>Estado Civil</Label>
              <Input
                value={form.estado_civil}
                onChange={(e) => setForm({ ...form, estado_civil: e.target.value })}
                placeholder="solteiro, casado..."
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="is_default"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Advogado padrão dos documentos
              </Label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={cancel} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

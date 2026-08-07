'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import type { LawFirm } from '@/lib/types'

interface SettingsFormProps {
  lawFirm: LawFirm | null
}

export function SettingsForm({ lawFirm }: SettingsFormProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: lawFirm?.name ?? '',
    oab_number: lawFirm?.oab_number ?? '',
    address: lawFirm?.address ?? '',
    phone: lawFirm?.phone ?? '',
    email: lawFirm?.email ?? '',
    pdf_margin_top_cm: String(lawFirm?.pdf_margin_top_cm ?? '3.0'),
    pdf_margin_left_cm: String(lawFirm?.pdf_margin_left_cm ?? '3.0'),
    pdf_margin_bottom_cm: String(lawFirm?.pdf_margin_bottom_cm ?? '2.0'),
    pdf_margin_right_cm: String(lawFirm?.pdf_margin_right_cm ?? '2.0'),
    pdf_font_family: lawFirm?.pdf_font_family ?? 'Times New Roman',
    pdf_line_spacing: String(lawFirm?.pdf_line_spacing ?? '1.5'),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const payload = {
        name: formData.name,
        oab_number: formData.oab_number,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        pdf_margin_top_cm: parseFloat(formData.pdf_margin_top_cm),
        pdf_margin_left_cm: parseFloat(formData.pdf_margin_left_cm),
        pdf_margin_bottom_cm: parseFloat(formData.pdf_margin_bottom_cm),
        pdf_margin_right_cm: parseFloat(formData.pdf_margin_right_cm),
        pdf_font_family: formData.pdf_font_family,
        pdf_line_spacing: parseFloat(formData.pdf_line_spacing),
      }

      if (lawFirm?.id) {
        const { error: updateError } = await supabase
          .from('law_firms')
          .update(payload)
          .eq('id', lawFirm.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('law_firms')
          .insert(payload)
        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-500/10 p-4 text-green-700 dark:text-green-400 text-sm">
          Configurações salvas com sucesso!
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Dados do Escritório</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Escritório</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oab">Número OAB do Escritório</Label>
            <Input
              id="oab"
              value={formData.oab_number}
              onChange={(e) => setFormData({ ...formData, oab_number: e.target.value })}
              placeholder="OAB/RO 3529"
              disabled={saving}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Endereço do Escritório</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua das Flores, 123, Porto Velho, RO"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Formatação de PDF (ABNT)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'top', label: 'Margem Superior (cm)', key: 'pdf_margin_top_cm' },
            { id: 'left', label: 'Margem Esquerda (cm)', key: 'pdf_margin_left_cm' },
            { id: 'bottom', label: 'Margem Inferior (cm)', key: 'pdf_margin_bottom_cm' },
            { id: 'right', label: 'Margem Direita (cm)', key: 'pdf_margin_right_cm' },
          ].map(({ id, label, key }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id}>{label}</Label>
              <Input
                id={id}
                type="number"
                step="0.1"
                value={(formData as any)[key]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                disabled={saving}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="font">Fonte</Label>
            <Input
              id="font"
              value={formData.pdf_font_family}
              onChange={(e) => setFormData({ ...formData, pdf_font_family: e.target.value })}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="spacing">Espaçamento entre linhas</Label>
            <Input
              id="spacing"
              type="number"
              step="0.1"
              value={formData.pdf_line_spacing}
              onChange={(e) => setFormData({ ...formData, pdf_line_spacing: e.target.value })}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </form>
  )
}

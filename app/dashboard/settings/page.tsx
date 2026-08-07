import { createClient } from '@/lib/supabase/server'
import type { LawFirm, Lawyer } from '@/lib/types'
import { SettingsForm } from '@/components/settings-form'
import { LawyersManager } from '@/components/lawyers-manager'

async function getLawFirm(): Promise<LawFirm | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('law_firms').select('*').limit(1).maybeSingle()
  return data ?? null
}

async function getLawyers(): Promise<Lawyer[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('lawyers')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
  return data ?? []
}

export default async function SettingsPage() {
  const [lawFirm, lawyers] = await Promise.all([getLawFirm(), getLawyers()])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="mt-2 text-muted-foreground">
          Dados do escritório, advogados e preferências de formatação
        </p>
      </div>

      {/* Escritório */}
      <div className="rounded-lg border border-border bg-card p-6">
        <SettingsForm lawFirm={lawFirm} />
      </div>

      {/* Advogados */}
      <div className="rounded-lg border border-border bg-card p-6">
        <LawyersManager initialLawyers={lawyers} />
      </div>
    </div>
  )
}

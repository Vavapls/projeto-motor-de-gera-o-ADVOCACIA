import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

async function getCounts() {
  const supabase = await createClient()
  const [clients, templates, documents, atendimentos] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('document_templates').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('generated_documents').select('id', { count: 'exact', head: true }),
    supabase.from('atendimentos').select('id', { count: 'exact', head: true }),
  ])
  return {
    clients: clients.count ?? 0,
    templates: templates.count ?? 0,
    documents: documents.count ?? 0,
    atendimentos: atendimentos.count ?? 0,
  }
}

async function getRecentAtendimentos() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('atendimentos')
    .select(`
      id, data_emissao, created_at,
      client:clients(full_name, razao_social, tipo_pessoa),
      category:document_categories(nome)
    `)
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
}

export default async function DashboardPage() {
  const [counts, recentAtendimentos] = await Promise.all([
    getCounts(),
    getRecentAtendimentos(),
  ])

  const stats = [
    { label: 'Clientes', value: counts.clients, href: '/dashboard/clients' },
    { label: 'Atendimentos', value: counts.atendimentos, href: '/dashboard/atendimentos' },
    { label: 'Modelos Ativos', value: counts.templates, href: '/dashboard/templates' },
    { label: 'Documentos', value: counts.documents, href: '/dashboard/documents' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Bem-vindo ao FG Gestão Jurídica
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/atendimentos/novo">+ Novo Atendimento</Link>
        </Button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-lg border border-border bg-card p-5 hover:bg-muted/30 transition-colors"
          >
            <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Atendimentos recentes */}
        <div className="md:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Atendimentos Recentes</h3>
            <Link href="/dashboard/atendimentos" className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {recentAtendimentos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm">Nenhum atendimento registrado ainda.</p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/dashboard/atendimentos/novo">Criar primeiro</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentAtendimentos.map((a: any) => {
                const clientName =
                  a.client?.tipo_pessoa === 'PJ'
                    ? (a.client.razao_social || a.client.full_name)
                    : a.client?.full_name
                return (
                  <li key={a.id}>
                    <Link
                      href={`/dashboard/atendimentos/${a.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{clientName}</p>
                        <p className="text-xs text-muted-foreground">{a.category?.nome ?? 'Sem categoria'}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.data_emissao).toLocaleDateString('pt-BR')}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Ações Rápidas</h3>
          <div className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/atendimentos/novo">Novo atendimento</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/clients/new">Cadastrar cliente</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/templates/upload">Upload de modelo</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/settings">Configurações</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

async function getAtendimento(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('atendimentos')
    .select(`
      *,
      client:clients(id, full_name, razao_social, tipo_pessoa, cpf_cnpj, phone, email),
      category:document_categories(nome)
    `)
    .eq('id', id)
    .single()
  return data
}

async function getDocuments(atendimentoId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('generated_documents')
    .select('id, status, generated_at, template:document_templates(name)')
    .eq('atendimento_id', atendimentoId)
    .order('generated_at')
  return data ?? []
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  finalizado: 'Finalizado',
  assinado: 'Assinado',
}

const statusColors: Record<string, string> = {
  rascunho: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  finalizado: 'bg-green-500/10 text-green-700 dark:text-green-400',
  assinado: 'bg-primary/10 text-primary',
}

export default async function AtendimentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [atendimento, documents] = await Promise.all([getAtendimento(id), getDocuments(id)])

  if (!atendimento) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Atendimento não encontrado</h1>
        <Link href="/dashboard/atendimentos" className="text-primary hover:underline text-sm">
          Voltar para atendimentos
        </Link>
      </div>
    )
  }

  const client = atendimento.client as any
  const clientName =
    client?.tipo_pessoa === 'PJ' ? (client.razao_social || client.full_name) : client?.full_name

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/atendimentos"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Atendimentos
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Atendimento — {clientName}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {atendimento.category?.nome ?? 'Sem categoria'} &middot; emitido em{' '}
            {formatDate(atendimento.data_emissao)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info do cliente */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Cliente</h3>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{clientName}</p>
            <p className="text-xs text-muted-foreground">{client?.cpf_cnpj}</p>
            <p className="text-xs text-muted-foreground">{client?.phone}</p>
            <p className="text-xs text-muted-foreground">{client?.email}</p>
          </div>
          <Link
            href={`/dashboard/clients/${client?.id}`}
            className="text-xs text-primary hover:underline"
          >
            Ver ficha completa
          </Link>
        </div>

        {/* Info do processo */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Processo</h3>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Número</p>
            <p className="text-sm font-mono text-foreground">
              {atendimento.process_number || '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Vara / Comarca</p>
            <p className="text-sm text-foreground">{atendimento.vara_comarca || '—'}</p>
          </div>
        </div>

        {/* Resumo */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Resumo</h3>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Documentos gerados</p>
            <p className="text-2xl font-bold text-foreground">{documents.length}</p>
          </div>
        </div>
      </div>

      {/* Documentos */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Documentos Gerados</h3>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum documento encontrado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Modelo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Gerado em</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: any) => (
                <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {doc.template?.name ?? 'Modelo removido'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[doc.status] ?? 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {statusLabels[doc.status] ?? doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(doc.generated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="text-primary hover:underline text-xs font-medium"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

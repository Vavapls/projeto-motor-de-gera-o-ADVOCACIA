import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ClientForm } from '@/components/client-form'
import { Button } from '@/components/ui/button'
import type { Client } from '@/lib/types'

async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

async function getClientDocuments(clientId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('generated_documents')
    .select(`
      id, status, generated_at, document_number,
      template:document_templates(name),
      atendimento:atendimentos(id, category:document_categories(nome))
    `)
    .eq('client_id', clientId)
    .order('generated_at', { ascending: false })
    .limit(30)
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

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [client, documents] = await Promise.all([
    getClientById(id),
    getClientDocuments(id),
  ])

  if (!client) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Cliente não encontrado</h1>
        <Link href="/dashboard/clients" className="text-primary hover:underline text-sm">
          Voltar para clientes
        </Link>
      </div>
    )
  }

  const displayName =
    client.tipo_pessoa === 'PJ'
      ? (client.razao_social || client.full_name)
      : client.full_name

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/clients"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Clientes
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-foreground">{displayName}</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {client.tipo_pessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'} &middot;{' '}
            {client.cpf_cnpj}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/atendimentos/novo?client=${id}`}>
            + Novo Atendimento
          </Link>
        </Button>
      </div>

      {/* Formulário de edição */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Dados do Cliente</h2>
        <ClientForm client={client} />
      </div>

      {/* Histórico de documentos */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Documentos Gerados</h2>
          <span className="text-sm text-muted-foreground">{documents.length} documento{documents.length !== 1 ? 's' : ''}</span>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhum documento gerado para este cliente.
            </p>
            <Button asChild className="mt-4" variant="outline" size="sm">
              <Link href={`/dashboard/atendimentos/novo?client=${id}`}>
                Criar primeiro atendimento
              </Link>
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Documento</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: any) => (
                <tr
                  key={doc.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {doc.template?.name ?? 'Modelo removido'}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{doc.document_number}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {doc.atendimento?.category?.nome ?? '—'}
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

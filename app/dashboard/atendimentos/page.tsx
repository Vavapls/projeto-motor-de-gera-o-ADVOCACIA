import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

async function getAtendimentos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('atendimentos')
    .select(`
      id, created_at, process_id, process_number, data_emissao, vara_comarca,
      client:clients(full_name, razao_social, tipo_pessoa, cpf_cnpj),
      category:document_categories(nome),
      process:processes(id, process_number)
    `)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return []
  return data ?? []
}

async function countDocsByAtendimento(ids: string[]) {
  if (ids.length === 0) return {}
  const supabase = await createClient()
  const { data } = await supabase
    .from('generated_documents')
    .select('atendimento_id')
    .in('atendimento_id', ids)
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.atendimento_id] = (counts[row.atendimento_id] ?? 0) + 1
  }
  return counts
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

export default async function AtendimentosPage() {
  const atendimentos = await getAtendimentos()
  const docCounts = await countDocsByAtendimento(atendimentos.map((a: any) => a.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atendimentos</h1>
          <p className="mt-2 text-muted-foreground">
            Histórico de atendimentos e documentos gerados
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/atendimentos/novo">+ Novo Atendimento</Link>
        </Button>
      </div>

      {atendimentos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Nenhum atendimento registrado.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/atendimentos/novo">Criar primeiro atendimento</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Processo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Emissão</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Docs</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {atendimentos.map((a: any) => {
                const clientName =
                  a.client?.tipo_pessoa === 'PJ'
                    ? (a.client.razao_social || a.client.full_name)
                    : a.client?.full_name
                return (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{clientName}</p>
                      <p className="text-xs text-muted-foreground">{a.client?.cpf_cnpj}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.category?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {/* Prioridade: process vinculado > campo texto legado */}
                      {(a as any).process?.process_number ?? a.process_number ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(a.data_emissao)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {docCounts[a.id] ?? 0} doc{(docCounts[a.id] ?? 0) !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/atendimentos/${a.id}`}
                        className="text-primary hover:underline text-xs font-medium"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getDocuments } from '@/lib/services/documents'
import { formatDate } from '@/lib/utils/format'

export default async function DocumentsPage() {
  const documents = await getDocuments()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documentos Gerados</h1>
          <p className="mt-2 text-muted-foreground">
            Histórico de documentos gerados e exportações
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/documents/new">Novo Documento</Link>
        </Button>
      </div>

      <Suspense fallback={<div className="text-center text-muted-foreground">Carregando...</div>}>
        {documents.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum documento gerado ainda
            </p>
            <Button asChild>
              <Link href="/dashboard/documents/new">Gerar primeiro documento</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Versão</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Gerado por</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="px-6 py-4 text-sm text-foreground font-medium">{doc.document_number}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'rascunho'
                          ? 'bg-yellow-100 text-yellow-800'
                          : doc.status === 'finalizado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      Sistema
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/documents/${doc.id}`}>Ver</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Suspense>
    </div>
  )
}

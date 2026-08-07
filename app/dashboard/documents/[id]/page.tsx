import { getDocumentById } from '@/lib/services/documents'
import { getTemplateById } from '@/lib/services/templates'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/format'

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const document = await getDocumentById(id)

  if (!document) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documento não encontrado</h1>
        </div>
      </div>
    )
  }

  const template = await getTemplateById(document.template_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Documento {document.document_number}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {template?.name || 'Modelo desconhecido'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Info */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Informações</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-foreground">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  document.status === 'rascunho'
                    ? 'bg-yellow-100 text-yellow-800'
                    : document.status === 'finalizado'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Criado em</p>
              <p className="text-foreground font-medium">
                {formatDate(document.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Versão</p>
              <p className="text-foreground font-medium">{document.document_number}</p>
            </div>
            {document.parent_document_id && (
              <div>
                <p className="text-sm text-muted-foreground">Baseado em</p>
                <Link
                  href={`/dashboard/documents/${document.parent_document_id}`}
                  className="text-primary hover:underline"
                >
                  Ver versão anterior
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Filled Data */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Dados Preenchidos</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(document.filled_data).map(([key, value]) => (
              <div key={key} className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="font-mono text-xs font-medium text-muted-foreground">{key}</p>
                <p className="text-sm text-foreground mt-1 break-all">
                  {String(value) || '(vazio)'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {document.status === 'rascunho' && (
          <Button asChild>
            <Link href={`/dashboard/documents/new?draft=${document.id}`}>
              Continuar editando
            </Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/dashboard/documents">Voltar</Link>
        </Button>
      </div>

      {/* Preview Note */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          <strong>Nota:</strong> Download de .docx e PDF será implementado na próxima fase.
          Atualmente os dados estão armazenados e as exportações serão geradas via docxtemplater e Puppeteer.
        </p>
      </div>
    </div>
  )
}

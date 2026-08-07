import { getTemplateById } from '@/lib/services/templates'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const template = await getTemplateById(id)

  if (!template) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Modelo não encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{template.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {template.description || 'Sem descrição'}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/documents?template=" + template.id}>
            Gerar Documento
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Template Info */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Informações</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Categoria</p>
              <p className="text-foreground font-medium">{template.category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Criado em</p>
              <p className="text-foreground font-medium">
                {new Date(template.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-foreground">
                {template.is_active ? (
                  <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                    Ativo
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-medium">
                    Inativo
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Placeholders */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">
            Campos detectados ({Object.keys(template.placeholder_json).length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(template.placeholder_json).map(([key, field]) => (
              <div key={key} className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-medium text-foreground">{key}</p>
                    <p className="text-xs text-muted-foreground mt-1">{field.display_label}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">
                      {field.field_type}
                    </span>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded">
                      {field.occurrences}x
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      {template.preview_text && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Preview</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
            {template.preview_text}
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/dashboard/templates">Voltar</Link>
        </Button>
      </div>
    </div>
  )
}

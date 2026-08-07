import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getTemplates } from '@/lib/services/templates'

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Biblioteca de Modelos</h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie templates de documentos jurídicos
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/templates/upload">Novo Modelo</Link>
        </Button>
      </div>

      <Suspense fallback={<div className="text-center text-muted-foreground">Carregando...</div>}>
        {templates.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum modelo cadastrado ainda
            </p>
            <Button asChild>
              <Link href="/dashboard/templates/upload">Fazer upload do primeiro modelo</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Categoria</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Campos</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="px-6 py-4 text-sm text-foreground">{template.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {template.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {Object.keys(template.placeholder_json).length} campo(s)
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/templates/${template.id}`}>Ver</Link>
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

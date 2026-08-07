import { ClientForm } from '@/components/client-form'

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Novo Cliente</h1>
        <p className="mt-2 text-muted-foreground">
          Preencha os dados do cliente para cadastrá-lo no sistema
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <ClientForm />
      </div>
    </div>
  )
}

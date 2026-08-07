import { NovoAtendimentoWizard } from '@/components/novo-atendimento-wizard'

export const metadata = {
  title: 'Novo Atendimento | FG Gestão Jurídica',
}

export default function NovoAtendimentoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Novo Atendimento</h1>
        <p className="mt-2 text-muted-foreground">
          Vincule um cliente, registre o caso e gere os documentos necessários em um único fluxo.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <NovoAtendimentoWizard />
      </div>
    </div>
  )
}

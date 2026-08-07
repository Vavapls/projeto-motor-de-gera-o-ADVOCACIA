import { Suspense } from 'react'
import { ClientsList } from '@/components/clients-list'
import { getClients } from '@/lib/services/clients'

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
        <p className="mt-2 text-muted-foreground">
          Gerencie todos os clientes do escritório
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-muted-foreground">Carregando...</div>}>
        <ClientsList initialClients={clients} />
      </Suspense>
    </div>
  )
}

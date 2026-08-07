'use client'

import { useState, useEffect } from 'react'
import { Client } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatCPF, formatPhone } from '@/lib/utils/format'

interface ClientsListProps {
  initialClients: Client[]
}

export function ClientsList({ initialClients }: ClientsListProps) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredClients, setFilteredClients] = useState<Client[]>(initialClients)

  useEffect(() => {
    const filtered = clients.filter((client) =>
      client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.cpf_cnpj.includes(searchQuery) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredClients(filtered)
  }, [searchQuery, clients])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar por nome, CPF/CNPJ ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button asChild>
          <Link href="/dashboard/clients/new">Novo cliente</Link>
        </Button>
      </div>

      {filteredClients.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {searchQuery ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Nome</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">CPF/CNPJ</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Telefone</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-b border-border hover:bg-muted/50 transition">
                  <td className="px-6 py-4 text-sm text-foreground">{client.full_name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{formatCPF(client.cpf_cnpj)}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{client.email}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{formatPhone(client.phone)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/clients/${client.id}`}>Ver</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

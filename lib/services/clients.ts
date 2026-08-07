import { createClient } from '@/lib/supabase/server'
import { Client } from '@/lib/types'

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function searchClients(query: string): Promise<Client[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or(
      `full_name.ilike.%${query}%,cpf_cnpj.ilike.%${query}%,email.ilike.%${query}%`
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createClientRecord(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...client,
      created_by_id: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateClient(
  id: string,
  updates: Partial<Client>
): Promise<Client> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) throw error
}

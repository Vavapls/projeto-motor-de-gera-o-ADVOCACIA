'use server'

import { createClient } from '@/lib/supabase/server'
import { Client } from '@/lib/types'

export async function createClientAction(
  client: Omit<Client, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: Client; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...client,
        created_by_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao criar cliente' }
  }
}

export async function updateClientAction(
  id: string,
  updates: Partial<Client>
): Promise<{ success: boolean; data?: Client; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar cliente' }
  }
}

export async function deleteClientAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('clients').delete().eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao deletar cliente' }
  }
}

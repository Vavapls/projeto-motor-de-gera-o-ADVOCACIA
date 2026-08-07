'use server'

import { createClient } from '@/lib/supabase/server'
import type { Lawyer } from '@/lib/types'

export async function getLawyersAction(): Promise<{ success: boolean; data?: Lawyer[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Não autenticado' }

    const { data, error } = await supabase
      .from('lawyers')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data ?? [] }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getDefaultLawyerAction(): Promise<{ success: boolean; data?: Lawyer; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Não autenticado' }

    const { data, error } = await supabase
      .from('lawyers')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    return { success: true, data: data ?? undefined }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function upsertLawyerAction(
  payload: Omit<Lawyer, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { id?: string }
): Promise<{ success: boolean; data?: Lawyer; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Não autenticado' }

    // Se is_default, remove flag dos outros antes
    if (payload.is_default) {
      await supabase
        .from('lawyers')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    let result
    if (payload.id) {
      const { id, ...updates } = payload
      result = await supabase
        .from('lawyers')
        .update({ ...updates, user_id: user.id })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('lawyers')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()
    }

    if (result.error) return { success: false, error: result.error.message }
    return { success: true, data: result.data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteLawyerAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('lawyers').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

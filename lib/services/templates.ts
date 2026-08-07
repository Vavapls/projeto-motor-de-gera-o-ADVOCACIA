import { createClient } from '@/lib/supabase/server'
import { DocumentTemplate, PlaceholderField } from '@/lib/types'

export async function getTemplates(): Promise<DocumentTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getTemplatesByCategory(category: string): Promise<DocumentTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getTemplateById(id: string): Promise<DocumentTemplate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function createTemplate(
  template: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<DocumentTemplate> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('document_templates')
    .insert({
      ...template,
      created_by_id: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTemplate(
  id: string,
  updates: Partial<DocumentTemplate>
): Promise<DocumentTemplate> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('document_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function searchTemplates(query: string): Promise<DocumentTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .or(
      `name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{"${query}"}`
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

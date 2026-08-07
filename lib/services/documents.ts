import { createClient } from '@/lib/supabase/server'
import { GeneratedDocument } from '@/lib/types'

export async function getDocuments(): Promise<GeneratedDocument[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('generated_documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getDocumentsByClient(clientId: string): Promise<GeneratedDocument[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('generated_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getDocumentsByTemplate(templateId: string): Promise<GeneratedDocument[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('generated_documents')
    .select('*')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getDocumentById(id: string): Promise<GeneratedDocument | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('generated_documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function createDocument(
  document: Omit<GeneratedDocument, 'id' | 'created_at' | 'updated_at'>
): Promise<GeneratedDocument> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('generated_documents')
    .insert({
      ...document,
      generated_by_id: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDocument(
  id: string,
  updates: Partial<GeneratedDocument>
): Promise<GeneratedDocument> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('generated_documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('generated_documents')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getNextDocumentNumber(templateId: string): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('generated_documents')
    .select('document_number')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error

  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].document_number.replace('v', ''))
    return `v${lastNumber + 1}`
  }

  return 'v1'
}

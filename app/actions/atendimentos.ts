'use server'

import { createClient } from '@/lib/supabase/server'
import type { Atendimento, GeneratedDocument, Client, DocumentTemplate } from '@/lib/types'
import { flexionar, flexionarEstadoCivil, flexionarNacionalidade } from '@/lib/utils/flexao-genero'

// -------------------------------------------------------
// Busca de clientes (autocomplete)
// -------------------------------------------------------
export async function searchClientsAction(query: string): Promise<{
  success: boolean
  data?: Pick<Client, 'id' | 'full_name' | 'razao_social' | 'cpf_cnpj' | 'tipo_pessoa'>[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const q = query.trim()
    if (!q) return { success: true, data: [] }

    const { data, error } = await supabase
      .from('clients')
      .select('id, full_name, razao_social, cpf_cnpj, tipo_pessoa')
      .or(`full_name.ilike.%${q}%,cpf_cnpj.ilike.%${q}%,razao_social.ilike.%${q}%`)
      .limit(10)

    if (error) return { success: false, error: error.message }
    return { success: true, data: data ?? [] }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// -------------------------------------------------------
// Busca de categorias
// -------------------------------------------------------
export async function getCategoriesAction(): Promise<{
  success: boolean
  data?: { id: string; nome: string }[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('document_categories')
      .select('id, nome')
      .order('nome')
    if (error) return { success: false, error: error.message }
    return { success: true, data: data ?? [] }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// -------------------------------------------------------
// Busca de templates ativos (com sugestão por grupo)
// -------------------------------------------------------
export async function getTemplatesForAtendimentoAction(categoryId?: string): Promise<{
  success: boolean
  data?: Pick<DocumentTemplate, 'id' | 'name' | 'placeholder_json' | 'grupo_atendimento'>[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    let q = supabase
      .from('document_templates')
      .select('id, name, placeholder_json, grupo_atendimento')
      .eq('is_active', true)

    if (categoryId) {
      q = q.eq('category_id', categoryId)
    }

    const { data, error } = await q.order('name')
    if (error) return { success: false, error: error.message }
    return { success: true, data: data ?? [] }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// -------------------------------------------------------
// Criar atendimento e gerar documentos em lote
// -------------------------------------------------------
export interface DocumentPayload {
  template_id: string
  specific_fields: Record<string, any>
}

export interface CreateAtendimentoPayload {
  // Passo 1
  client_id: string
  // Passo 2
  process_number?: string
  category_id?: string
  vara_comarca?: string
  // Passo 3
  data_emissao: string
  local_emissao?: string
  documents: DocumentPayload[]
}

export async function createAtendimentoAction(payload: CreateAtendimentoPayload): Promise<{
  success: boolean
  atendimento_id?: string
  document_ids?: string[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Não autenticado' }

    // Buscar dados do cliente (snapshot)
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('id', payload.client_id)
      .single()
    if (clientErr || !client) return { success: false, error: 'Cliente não encontrado' }

    // Buscar advogado padrão (snapshot)
    const { data: lawyer } = await supabase
      .from('lawyers')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .maybeSingle()

    // Buscar dados do escritório (snapshot)
    const { data: lawFirm } = await supabase
      .from('law_firms')
      .select('*')
      .limit(1)
      .maybeSingle()

    // Criar o atendimento
    const { data: atendimento, error: atendErr } = await supabase
      .from('atendimentos')
      .insert({
        client_id: payload.client_id,
        process_number: payload.process_number || null,
        category_id: payload.category_id || null,
        vara_comarca: payload.vara_comarca || null,
        data_emissao: payload.data_emissao,
        local_emissao: payload.local_emissao || lawFirm?.address?.split(',')[2]?.trim() || null,
        created_by_id: user.id,
      })
      .select()
      .single()

    if (atendErr || !atendimento) return { success: false, error: atendErr?.message ?? 'Erro ao criar atendimento' }

    // Montar snapshot global (cliente + advogado + data)
    const genero = client.genero ?? null
    const globalSnapshot = {
      'cliente.nome': client.tipo_pessoa === 'PJ' ? (client.razao_social || client.full_name) : client.full_name,
      'cliente.tipo_pessoa': client.tipo_pessoa,
      'cliente.genero': genero,
      'cliente.cpf_cnpj': client.cpf_cnpj,
      'cliente.rg': client.rg ?? '',
      'cliente.nacionalidade': flexionarNacionalidade(client.nationality, genero),
      'cliente.estado_civil': flexionarEstadoCivil(client.civil_status, genero),
      'cliente.endereco_completo': client.address,
      'cliente.profissao': client.profession ?? '',
      'advogado.nome': lawyer?.full_name ?? '',
      'advogado.oab': lawyer?.oab ?? '',
      'advogado.profissao_flexionada': flexionar('advogado', lawyer?.genero ?? 'M'),
      'advogado.estado_civil_flexionado': lawyer?.estado_civil
        ? flexionar(lawyer.estado_civil.split('/')[0], lawyer.genero ?? 'M')
        : '',
      'advogado.endereco_escritorio': lawFirm?.address ?? '',
      'documento.data_emissao': payload.data_emissao,
      'documento.local_emissao': payload.local_emissao || lawFirm?.address?.split(',')[2]?.trim() || '',
      'processo.numero': payload.process_number ?? '',
      'processo.vara_comarca': payload.vara_comarca ?? '',
    }

    // Criar cada documento com o snapshot completo
    const docIds: string[] = []
    for (const doc of payload.documents) {
      const filledData = {
        ...globalSnapshot,
        ...doc.specific_fields,
        _snapshot_client: client,
        _snapshot_lawyer: lawyer,
        _snapshot_law_firm: lawFirm,
      }

      const { data: genDoc, error: docErr } = await supabase
        .from('generated_documents')
        .insert({
          client_id: payload.client_id,
          atendimento_id: atendimento.id,
          template_id: doc.template_id,
          document_number: 'v1',
          filled_data: filledData,
          status: 'rascunho',
          generated_at: new Date().toISOString(),
          generated_by_id: user.id,
        })
        .select('id')
        .single()

      if (!docErr && genDoc) docIds.push(genDoc.id)
    }

    return { success: true, atendimento_id: atendimento.id, document_ids: docIds }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// -------------------------------------------------------
// Listar atendimentos
// -------------------------------------------------------
export async function getAtendimentosAction(): Promise<{
  success: boolean
  data?: (Atendimento & { client: Pick<Client, 'full_name' | 'razao_social' | 'tipo_pessoa'> })[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*, client:clients(full_name, razao_social, tipo_pessoa), category:document_categories(nome)')
      .order('created_at', { ascending: false })
    if (error) return { success: false, error: error.message }
    return { success: true, data: data as any ?? [] }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export type TipoPessoa = 'PF' | 'PJ'
export type Genero = 'M' | 'F' | 'outro'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'colaborador'
  created_at: string
  updated_at: string
}

export interface LawFirm {
  id: string
  name: string
  logo_url: string | null
  oab_number: string
  address: string
  phone: string
  email: string
  pdf_margin_top_cm: number
  pdf_margin_left_cm: number
  pdf_margin_bottom_cm: number
  pdf_margin_right_cm: number
  pdf_font_family: string
  pdf_line_spacing: number
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  tipo_pessoa: TipoPessoa
  full_name: string
  razao_social: string | null
  tipo_empresa: string | null
  cpf_cnpj: string
  birth_date: string | null
  rg: string | null
  genero: Genero | null
  nationality: string
  profession: string
  civil_status: 'solteiro' | 'casado' | 'divorciado' | 'viúvo' | null
  address: string
  phone: string
  email: string
  created_by_id: string
  created_at: string
  updated_at: string
  /** null = ativo; preenchido = soft-deleted. Filtrar IS NULL em todas as queries. */
  deleted_at: string | null
}

export interface Lawyer {
  id: string
  user_id: string
  full_name: string
  genero: Genero
  nacionalidade: string
  estado_civil: string | null
  oab: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface DocumentCategory {
  id: string
  nome: string
  descricao: string | null
  created_at: string
}

export interface Process {
  id: string
  client_id: string
  process_number: string | null
  action_type: string
  category: string
  court_district: string | null
  status: 'analise' | 'protocolado' | 'andamento' | 'aguardando_decisao' | 'concluido' | 'arquivado'
  opening_date: string
  created_at: string
  updated_at: string
}

export interface DocumentTemplate {
  id: string
  name: string
  category: string | null
  category_id: string | null
  grupo_atendimento: string | null
  description: string | null
  tags: string[]
  original_docx_url: string
  placeholder_json: Record<string, PlaceholderField>
  preview_text: string | null
  is_active: boolean
  created_by_id: string
  created_at: string
  updated_at: string
  /** null = ativo; preenchido = soft-deleted. Filtrar IS NULL em todas as queries. */
  deleted_at: string | null
}

export interface PlaceholderField {
  display_label: string
  field_type: 'text' | 'cpf' | 'cnpj' | 'date' | 'currency' | 'select' | 'textarea'
  required: boolean
  occurrences: number
  options?: string[]
}

export interface Atendimento {
  id: string
  client_id: string
  /**
   * FK para processes.id — fonte de verdade quando preenchida.
   * Quando não nula, process_number exibido vem do join (campo `process`).
   */
  process_id: string | null
  /**
   * Campo legado — texto livre, usado apenas quando process_id for null.
   * Nunca usar como fonte de verdade se process_id estiver preenchido.
   */
  process_number: string | null
  category_id: string | null
  vara_comarca: string | null
  data_emissao: string
  local_emissao: string | null
  created_by_id: string
  created_at: string
  // joins opcionais
  client?: Client
  category?: DocumentCategory
  /** Disponível quando process_id não é nulo e a query faz join com processes */
  process?: Pick<Process, 'id' | 'process_number'>
}

export interface GeneratedDocument {
  id: string
  client_id: string | null
  process_id: string | null
  atendimento_id: string | null
  template_id: string
  document_number: string
  parent_document_id: string | null
  filled_data: Record<string, any>
  docx_url: string | null
  pdf_url: string | null
  status: 'rascunho' | 'finalizado' | 'assinado'
  generated_at: string
  generated_by_id: string
  created_at: string
  updated_at: string
  /** null = ativo; preenchido = soft-deleted. Filtrar IS NULL em todas as queries. */
  deleted_at: string | null
  // joins opcionais
  template?: DocumentTemplate
  client?: Client
}

export interface AuditLog {
  id: string
  document_id: string
  action: 'gerado' | 'editado' | 'exportado' | 'deletado' | 'salvo_como_rascunho'
  user_id: string
  details: Record<string, any> | null
  timestamp: string
}

import { PlaceholderField } from '@/lib/types'

/**
 * Extrai placeholders de um arquivo DOCX convertido em base64
 * Detecta padrão {{NOME_CAMPO}} e inferis tipos de campo
 */
export async function extractPlaceholders(
  docxBase64: string
): Promise<{ placeholders: Record<string, PlaceholderField>; previewText: string }> {
  try {
    // Converte base64 para ArrayBuffer
    const binaryString = atob(docxBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Carrega JSZip dinamicamente
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(bytes.buffer)

    // Extrai document.xml
    const docXml = await zip.file('word/document.xml')?.async('string')
    if (!docXml) throw new Error('document.xml não encontrado')

    // Parse XML simples para encontrar placeholders {{CAMPO}}
    const placeholderRegex = /{{([A-Z_]+)}}/g
    const matches = [...docXml.matchAll(placeholderRegex)]
    const placeholderNames = new Set(matches.map((m) => m[1]))

    // Inferir tipos de campos baseado no nome
    const placeholders: Record<string, PlaceholderField> = {}
    const occurrences: Record<string, number> = {}

    // Contar ocorrências de cada placeholder
    for (const [, name] of matches) {
      occurrences[name] = (occurrences[name] || 0) + 1
    }

    // Criar definições de campos com tipos inferidos
    for (const name of placeholderNames) {
      placeholders[name] = {
        display_label: formatLabel(name),
        field_type: inferFieldType(name),
        required: true,
        occurrences: occurrences[name] || 1,
      }
    }

    // Gerar preview text (primeiros 500 caracteres)
    const textContent = docXml.replace(/<[^>]*>/g, ' ').substring(0, 500)
    const previewText = `${textContent}...`

    return {
      placeholders,
      previewText,
    }
  } catch (error) {
    console.error('[v0] Erro ao fazer parsing do DOCX:', error)
    throw new Error('Erro ao processar arquivo DOCX')
  }
}

/**
 * Infere o tipo de campo baseado no nome do placeholder
 */
export function inferFieldType(
  fieldName: string
): 'text' | 'cpf' | 'cnpj' | 'date' | 'currency' | 'select' | 'textarea' {
  const lower = fieldName.toLowerCase()

  if (lower.includes('cpf')) return 'cpf'
  if (lower.includes('cnpj')) return 'cnpj'
  if (lower.includes('data') || lower.includes('date')) return 'date'
  if (lower.includes('valor') || lower.includes('preco') || lower.includes('price'))
    return 'currency'
  if (lower.includes('descricao') || lower.includes('description') || lower.includes('obs'))
    return 'textarea'

  return 'text'
}

/**
 * Formata nome de campo em label legível
 * Ex: NOME_CLIENTE -> Nome Cliente
 */
export function formatLabel(fieldName: string): string {
  return fieldName
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Valida se um DOCX é válido (tem extensão .docx e estrutura ZIP)
 */
export async function isValidDocx(file: File): Promise<boolean> {
  if (!file.name.endsWith('.docx')) return false

  try {
    const JSZip = (await import('jszip')).default
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)
    return zip.file('word/document.xml') !== null
  } catch {
    return false
  }
}

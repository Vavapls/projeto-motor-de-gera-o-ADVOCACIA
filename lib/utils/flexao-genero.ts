import type { Genero } from '@/lib/types'

/**
 * Dicionário de flexões para os termos que aparecem nos documentos jurídicos.
 * Chave: forma masculina (usada como referência).
 * Valor: { M, F, outro }
 */
const FLEXOES: Record<string, Record<Genero, string>> = {
  advogado: { M: 'advogado', F: 'advogada', outro: 'advogado(a)' },
  solteiro: { M: 'solteiro', F: 'solteira', outro: 'solteiro(a)' },
  casado: { M: 'casado', F: 'casada', outro: 'casado(a)' },
  divorciado: { M: 'divorciado', F: 'divorciada', outro: 'divorciado(a)' },
  viúvo: { M: 'viúvo', F: 'viúva', outro: 'viúvo(a)' },
  brasileiro: { M: 'brasileiro', F: 'brasileira', outro: 'brasileiro(a)' },
  inscrito: { M: 'inscrito', F: 'inscrita', outro: 'inscrito(a)' },
  portador: { M: 'portador', F: 'portadora', outro: 'portador(a)' },
  residente: { M: 'residente', F: 'residente', outro: 'residente' },
  outorgante: { M: 'outorgante', F: 'outorgante', outro: 'outorgante' },
  declarante: { M: 'declarante', F: 'declarante', outro: 'declarante' },
  contratante: { M: 'contratante', F: 'contratante', outro: 'contratante' },
}

/**
 * Flexiona um termo de acordo com o gênero.
 * Se o termo não estiver no dicionário, retorna o próprio termo sem alteração.
 * Preserva a capitalização inicial.
 */
export function flexionar(termo: string, genero: Genero | null | undefined): string {
  const g: Genero = genero ?? 'M'
  const chave = termo.toLowerCase()
  const flexao = FLEXOES[chave]
  if (!flexao) return termo

  const resultado = flexao[g]
  // Preserva capitalização: se o termo original começa maiúsculo, capitaliza resultado
  if (termo[0] === termo[0].toUpperCase() && termo[0] !== termo[0].toLowerCase()) {
    return resultado.charAt(0).toUpperCase() + resultado.slice(1)
  }
  return resultado
}

/**
 * Flexiona o estado civil de um cliente para uso em documentos.
 * Aceita os valores do banco ('solteiro', 'casado', 'divorciado', 'viúvo').
 */
export function flexionarEstadoCivil(
  civil_status: string | null | undefined,
  genero: Genero | null | undefined
): string {
  if (!civil_status) return ''
  return flexionar(civil_status, genero)
}

/**
 * Flexiona a nacionalidade. Suporta "brasileiro/a" e formas comuns.
 * Para outras nacionalidades sem forma no dicionário, retorna o valor original.
 */
export function flexionarNacionalidade(
  nacionalidade: string | null | undefined,
  genero: Genero | null | undefined
): string {
  if (!nacionalidade) return ''
  const n = nacionalidade.toLowerCase().trim()
  // Tenta flexionar direto se estiver no dicionário
  const direto = FLEXOES[n]
  if (direto) return flexionar(n, genero)
  // Heurística: palavras que terminam em 'o' geralmente flexionam para 'a' no F
  if (genero === 'F' && n.endsWith('o')) {
    return nacionalidade.slice(0, -1) + 'a'
  }
  return nacionalidade
}

/**
 * Retorna aviso quando gênero não está definido, para exibir no preview.
 */
export function avisoGeneroIndefinido(genero: Genero | null | undefined): string | null {
  if (!genero) {
    return 'Gênero não definido — revise a concordância do documento antes de exportar.'
  }
  return null
}

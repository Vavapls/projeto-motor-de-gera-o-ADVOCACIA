/**
 * Validadores de documentos brasileiros.
 * Implementações dos algoritmos públicos de dígito verificador.
 * Sem dependências externas.
 */

// -------------------------------------------------------
// Utilitários internos
// -------------------------------------------------------

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function allSame(digits: string): boolean {
  return digits.split('').every((d) => d === digits[0])
}

// -------------------------------------------------------
// CPF (11 dígitos)
// Algoritmo: módulo 11 com pesos 10-2 e 11-2
// -------------------------------------------------------
export function validateCPF(value: string): boolean {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11) return false
  if (allSame(cpf)) return false // ex: 000.000.000-00

  // Primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let remainder = sum % 11
  const d1 = remainder < 2 ? 0 : 11 - remainder
  if (d1 !== parseInt(cpf[9])) return false

  // Segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  remainder = sum % 11
  const d2 = remainder < 2 ? 0 : 11 - remainder
  return d2 === parseInt(cpf[10])
}

// -------------------------------------------------------
// CNPJ (14 dígitos)
// Algoritmo: módulo 11 com pesos 5,4,3,2,9,8,7,6,5,4,3,2
// -------------------------------------------------------
export function validateCNPJ(value: string): boolean {
  const cnpj = onlyDigits(value)
  if (cnpj.length !== 14) return false
  if (allSame(cnpj)) return false // ex: 00.000.000/0000-00

  const calcDigit = (base: string, weights: number[]): number => {
    const sum = base
      .split('')
      .reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0)
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const d1 = calcDigit(cnpj.slice(0, 12), weights1)
  if (d1 !== parseInt(cnpj[12])) return false

  const d2 = calcDigit(cnpj.slice(0, 13), weights2)
  return d2 === parseInt(cnpj[13])
}

// -------------------------------------------------------
// Número de processo CNJ
// Formato: NNNNNNN-DD.AAAA.J.TT.OOOO  (20 dígitos no total)
// Resolução 65/2008 do CNJ — algoritmo módulo 97 (ISO 7064)
//
// Cálculo dos dígitos verificadores DD:
//   base = NNNNNNN + AAAA + J + TT + OOOO  (18 dígitos, sem os DD)
//   string_para_mod = base[0..6] + "00" + base[7..17]  (inserir "00" na posição dos DD)
//   Equivalente: NNNNNNN + "00" + AAAA + J + TT + OOOO
//   DD = 98 - (BigInt(string_para_mod) % 97n)
// -------------------------------------------------------
export function validateCNJ(value: string): boolean {
  const digits = onlyDigits(value)
  // 20 dígitos: 7 (N) + 2 (D) + 4 (A) + 1 (J) + 2 (T) + 4 (O)
  if (digits.length !== 20) return false

  const N = digits.slice(0, 7)   // número do processo
  const DD = digits.slice(7, 9)  // dígitos verificadores
  const A = digits.slice(9, 13)  // ano
  const J = digits.slice(13, 14) // segmento de justiça
  const T = digits.slice(14, 16) // tribunal
  const O = digits.slice(16, 20) // origem (vara/comarca)

  // Monta a string com "00" no lugar dos dígitos verificadores
  const base = `${N}00${A}${J}${T}${O}`

  const expected = 98 - Number(BigInt(base) % 97n)
  const actual = parseInt(DD, 10)

  return expected === actual
}

// Retorna mensagem de erro amigável ou null se válido
export function getCNJError(value: string): string | null {
  if (!value) return null // campo opcional — ausência não é erro
  const digits = onlyDigits(value)
  if (digits.length !== 20) return 'Número CNJ deve ter 20 dígitos (formato: 0000000-00.0000.0.00.0000)'
  if (!validateCNJ(value)) return 'Dígito verificador do processo CNJ inválido'
  return null
}

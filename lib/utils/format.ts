export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '')
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`
  }
  return cpf
}

export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length === 14) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`
  }
  return cnpj
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`
  }
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
  }
  return phone
}

export function isCPF(value: string): boolean {
  const clean = value.replace(/\D/g, '')
  return clean.length === 11
}

export function isCNPJ(value: string): boolean {
  const clean = value.replace(/\D/g, '')
  return clean.length === 14
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

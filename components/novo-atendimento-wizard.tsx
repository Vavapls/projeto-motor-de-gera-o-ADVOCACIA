'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClientForm } from '@/components/client-form'
import {
  searchClientsAction,
  getCategoriesAction,
  getTemplatesForAtendimentoAction,
  createAtendimentoAction,
  type DocumentPayload,
} from '@/app/actions/atendimentos'
import type { Client, DocumentTemplate } from '@/lib/types'

// Placeholders que vêm do cliente/advogado/data — não devem aparecer no formulário de campos específicos
const GLOBAL_PREFIXES = ['cliente.', 'advogado.', 'documento.', 'processo.']
function isGlobal(key: string) {
  return GLOBAL_PREFIXES.some((p) => key.startsWith(p))
}

type Step = 1 | 2 | 3

interface TemplateSelection {
  template: Pick<DocumentTemplate, 'id' | 'name' | 'placeholder_json' | 'grupo_atendimento'>
  checked: boolean
  fields: Record<string, string>
}

export function NovoAtendimentoWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Passo 1
  const [clientQuery, setClientQuery] = useState('')
  const [clientResults, setClientResults] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Passo 2
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [processNumber, setProcessNumber] = useState('')
  const [varaComarca, setVaraComarca] = useState('')

  // Passo 3
  const [templateSelections, setTemplateSelections] = useState<TemplateSelection[]>([])
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0])
  const [localEmissao, setLocalEmissao] = useState('')

  // Carregar categorias uma vez
  useEffect(() => {
    getCategoriesAction().then((r) => {
      if (r.success) setCategories(r.data ?? [])
    })
  }, [])

  // Carregar templates ao entrar no passo 3
  useEffect(() => {
    if (step !== 3) return
    getTemplatesForAtendimentoAction(categoryId || undefined).then((r) => {
      if (!r.success) return
      const templates = r.data ?? []
      setTemplateSelections(
        templates.map((t) => ({
          template: t,
          checked: false,
          fields: {},
        }))
      )
    })
  }, [step, categoryId])

  // Autocomplete de clientes
  const handleClientSearch = useCallback((q: string) => {
    setClientQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (q.length < 2) { setClientResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      const r = await searchClientsAction(q)
      if (r.success) setClientResults(r.data ?? [])
    }, 300)
  }, [])

  function selectClient(c: any) {
    setSelectedClient(c as Client)
    setClientQuery(c.tipo_pessoa === 'PJ' ? (c.razao_social || c.full_name) : c.full_name)
    setClientResults([])
    setShowNewClientForm(false)
  }

  function handleNewClientSuccess(client: Client) {
    setSelectedClient(client)
    setClientQuery(client.tipo_pessoa === 'PJ' ? (client.razao_social || client.full_name) : client.full_name)
    setShowNewClientForm(false)
  }

  function toggleTemplate(idx: number) {
    setTemplateSelections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, checked: !s.checked } : s))
    )
  }

  function setField(templateIdx: number, key: string, value: string) {
    setTemplateSelections((prev) =>
      prev.map((s, i) =>
        i === templateIdx ? { ...s, fields: { ...s.fields, [key]: value } } : s
      )
    )
  }

  async function handleSubmit() {
    setError(null)
    if (!selectedClient) { setError('Selecione ou cadastre um cliente'); return }
    const selected = templateSelections.filter((s) => s.checked)
    if (selected.length === 0) { setError('Selecione pelo menos um documento'); return }

    setSubmitting(true)
    const documents: DocumentPayload[] = selected.map((s) => ({
      template_id: s.template.id,
      specific_fields: s.fields,
    }))

    const result = await createAtendimentoAction({
      client_id: selectedClient.id,
      process_number: processNumber || undefined,
      category_id: categoryId || undefined,
      vara_comarca: varaComarca || undefined,
      data_emissao: dataEmissao,
      local_emissao: localEmissao || undefined,
      documents,
    })

    setSubmitting(false)
    if (!result.success) {
      setError(result.error ?? 'Erro ao criar atendimento')
      return
    }
    router.push(`/dashboard/atendimentos/${result.atendimento_id}`)
  }

  // Campos específicos de um template (excluindo globais)
  function getSpecificFields(t: TemplateSelection['template']) {
    return Object.entries(t.placeholder_json ?? {}).filter(
      ([key]) => !isGlobal(key)
    )
  }

  // ------ Renderização ------

  const stepLabels = ['Cliente', 'Caso / Processo', 'Documentos']

  return (
    <div className="space-y-8">
      {/* Indicador de passos */}
      <nav aria-label="Passos do atendimento">
        <ol className="flex items-center gap-0">
          {stepLabels.map((label, i) => {
            const n = (i + 1) as Step
            const isActive = step === n
            const isDone = step > n
            return (
              <li key={n} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isDone
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isDone ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      n
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className="mx-3 h-px w-12 bg-border" />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
      )}

      {/* ---------- PASSO 1: CLIENTE ---------- */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Qual é o cliente?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Busque um cliente existente ou cadastre um novo.
            </p>
          </div>

          {!showNewClientForm && (
            <div className="space-y-2 relative">
              <Label>Buscar por nome, CPF ou CNPJ</Label>
              <Input
                value={clientQuery}
                onChange={(e) => handleClientSearch(e.target.value)}
                placeholder="João Silva ou 000.000.000-00"
                autoComplete="off"
              />
              {clientResults.length > 0 && (
                <ul className="absolute z-20 top-full mt-1 w-full rounded-lg border border-border bg-popover shadow-md overflow-hidden">
                  {clientResults.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        onClick={() => selectClient(c)}
                      >
                        <span className="font-medium">
                          {c.tipo_pessoa === 'PJ' ? (c.razao_social || c.full_name) : c.full_name}
                        </span>
                        <span className="text-muted-foreground ml-2">{c.cpf_cnpj}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {selectedClient && (
                <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {selectedClient.tipo_pessoa === 'PJ'
                        ? (selectedClient.razao_social || selectedClient.full_name)
                        : selectedClient.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedClient.cpf_cnpj}</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => { setSelectedClient(null); setClientQuery('') }}
                  >
                    Trocar
                  </button>
                </div>
              )}

              <button
                type="button"
                className="text-sm text-primary hover:underline mt-2 inline-block"
                onClick={() => { setShowNewClientForm(true); setSelectedClient(null); setClientQuery('') }}
              >
                + Cadastrar novo cliente
              </button>
            </div>
          )}

          {showNewClientForm && (
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Novo Cliente</h3>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewClientForm(false)}
                >
                  Cancelar
                </button>
              </div>
              <ClientForm compact onSuccess={handleNewClientSuccess} />
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (!selectedClient) { setError('Selecione ou cadastre um cliente'); return }
                setError(null)
                setStep(2)
              }}
              disabled={!selectedClient}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* ---------- PASSO 2: CASO ---------- */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Dados do caso</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Opcional — preencha se o processo já existir ou deixe em branco.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Número do processo</Label>
              <Input
                value={processNumber}
                onChange={(e) => setProcessNumber(e.target.value)}
                placeholder="0000000-00.0000.0.00.0000 (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Vara / Comarca</Label>
              <Input
                value={varaComarca}
                onChange={(e) => setVaraComarca(e.target.value)}
                placeholder="1ª Vara Cível de Porto Velho (opcional)"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
            <Button onClick={() => { setError(null); setStep(3) }}>Próximo</Button>
          </div>
        </div>
      )}

      {/* ---------- PASSO 3: DOCUMENTOS ---------- */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Documentos a gerar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione os modelos e preencha os campos específicos de cada um.
            </p>
          </div>

          {/* Data e local */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de emissão</Label>
              <Input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Local de emissão</Label>
              <Input
                value={localEmissao}
                onChange={(e) => setLocalEmissao(e.target.value)}
                placeholder="Porto Velho, RO (padrão do escritório)"
              />
            </div>
          </div>

          {templateSelections.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Nenhum modelo disponível.{' '}
                <a href="/dashboard/templates/upload" className="text-primary hover:underline">
                  Faça upload de um modelo .docx
                </a>{' '}
                para começar.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {templateSelections.map((sel, idx) => {
              const specificFields = getSpecificFields(sel.template)
              return (
                <div
                  key={sel.template.id}
                  className={`rounded-lg border transition-colors ${
                    sel.checked ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={sel.checked}
                      onChange={() => toggleTemplate(idx)}
                    />
                    <span className="font-medium text-sm text-foreground">{sel.template.name}</span>
                    {sel.template.grupo_atendimento && (
                      <span className="ml-auto text-xs text-muted-foreground rounded-full border border-border px-2 py-0.5">
                        {sel.template.grupo_atendimento}
                      </span>
                    )}
                  </label>

                  {sel.checked && specificFields.length > 0 && (
                    <div className="border-t border-border px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {specificFields.map(([key, field]) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-xs">
                            {field.display_label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </Label>
                          {field.field_type === 'textarea' ? (
                            <textarea
                              rows={3}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                              value={sel.fields[key] ?? ''}
                              onChange={(e) => setField(idx, key, e.target.value)}
                            />
                          ) : field.field_type === 'select' && field.options ? (
                            <Select
                              value={sel.fields[key] ?? ''}
                              onValueChange={(v) => setField(idx, key, v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((o) => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={field.field_type === 'date' ? 'date' : field.field_type === 'currency' ? 'number' : 'text'}
                              placeholder={`${field.display_label}...`}
                              value={sel.fields[key] ?? ''}
                              onChange={(e) => setField(idx, key, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? 'Gerando...'
                : `Gerar ${templateSelections.filter((s) => s.checked).length || ''} documento${templateSelections.filter((s) => s.checked).length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

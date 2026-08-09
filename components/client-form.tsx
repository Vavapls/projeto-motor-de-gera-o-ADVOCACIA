'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import type { Client, TipoPessoa, Genero } from '@/lib/types'
import { createClientAction, updateClientAction } from '@/app/actions/clients'
import { validateCPF, validateCNPJ } from '@/lib/utils/validators'

const civilStatusOptions = ['solteiro', 'casado', 'divorciado', 'viúvo'] as const
const generoOptions: { value: Genero; label: string }[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'outro', label: 'Outro / Não informar' },
]

// Base schema — validação de dígito verificador via superRefine
// O valor cpf_cnpj chega com ou sem máscara; o validator ignora não-dígitos.
const clientSchema = z
  .object({
    tipo_pessoa: z.enum(['PF', 'PJ']),
    // PF
    full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    genero: z.enum(['M', 'F', 'outro']).optional(),
    rg: z.string().optional(),
    birth_date: z.string().optional(),
    civil_status: z.enum(['solteiro', 'casado', 'divorciado', 'viúvo']).optional(),
    nationality: z.string().optional(),
    profession: z.string().optional(),
    // PJ
    razao_social: z.string().optional(),
    tipo_empresa: z.string().optional(),
    // Comuns
    cpf_cnpj: z.string().min(1, 'CPF/CNPJ obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  })
  .superRefine((data, ctx) => {
    if (data.tipo_pessoa === 'PF') {
      if (!validateCPF(data.cpf_cnpj)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CPF inválido — verifique os dígitos',
          path: ['cpf_cnpj'],
        })
      }
    } else {
      if (!validateCNPJ(data.cpf_cnpj)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CNPJ inválido — verifique os dígitos',
          path: ['cpf_cnpj'],
        })
      }
    }
  })

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  client?: Client
  onSuccess?: (client: Client) => void
  compact?: boolean // para uso inline no fluxo de atendimento
}

export function ClientForm({ client, onSuccess, compact = false }: ClientFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client
      ? {
          tipo_pessoa: client.tipo_pessoa ?? 'PF',
          full_name: client.full_name ?? '',
          genero: client.genero ?? undefined,
          rg: client.rg ?? '',
          birth_date: client.birth_date ?? '',
          civil_status: client.civil_status ?? undefined,
          nationality: client.nationality ?? '',
          profession: client.profession ?? '',
          razao_social: client.razao_social ?? '',
          tipo_empresa: client.tipo_empresa ?? '',
          cpf_cnpj: client.cpf_cnpj ?? '',
          email: client.email ?? '',
          phone: client.phone ?? '',
          address: client.address ?? '',
        }
      : { tipo_pessoa: 'PF' },
  })

  const tipoPessoa = watch('tipo_pessoa')
  const isPF = tipoPessoa === 'PF'

  async function onSubmit(data: ClientFormData) {
    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        tipo_pessoa: data.tipo_pessoa,
        full_name: data.full_name,
        cpf_cnpj: data.cpf_cnpj,
        email: data.email,
        phone: data.phone,
        address: data.address,
        genero: data.genero ?? null,
        // PF
        rg: isPF ? (data.rg || null) : null,
        birth_date: isPF ? (data.birth_date || null) : null,
        civil_status: isPF ? (data.civil_status || null) : null,
        nationality: isPF ? (data.nationality || null) : null,
        profession: isPF ? (data.profession || null) : null,
        // PJ
        razao_social: !isPF ? (data.razao_social || null) : null,
        tipo_empresa: !isPF ? (data.tipo_empresa || null) : null,
      }

      let result
      if (client) {
        result = await updateClientAction(client.id, payload)
      } else {
        result = await createClientAction(payload)
      }

      if (!result.success) {
        setError(result.error || 'Erro ao salvar cliente')
        return
      }

      if (onSuccess && result.data) {
        onSuccess(result.data)
      } else {
        router.push('/dashboard/clients')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Tipo de Pessoa */}
      <div className="flex gap-2 p-1 rounded-lg bg-muted w-fit">
        {(['PF', 'PJ'] as TipoPessoa[]).map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => setValue('tipo_pessoa', tp)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tipoPessoa === tp
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tp === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome / Razão Social */}
        <div className="space-y-2">
          <Label htmlFor="full_name">{isPF ? 'Nome Completo' : 'Nome do Representante'} *</Label>
          <Input
            id="full_name"
            placeholder={isPF ? 'João Silva' : 'Maria Santos'}
            {...register('full_name')}
            className={errors.full_name ? 'border-destructive' : ''}
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        {/* CPF / CNPJ */}
        <div className="space-y-2">
          <Label htmlFor="cpf_cnpj">{isPF ? 'CPF' : 'CNPJ'} *</Label>
          <Input
            id="cpf_cnpj"
            placeholder={isPF ? '000.000.000-00' : '00.000.000/0001-00'}
            {...register('cpf_cnpj')}
            className={errors.cpf_cnpj ? 'border-destructive' : ''}
          />
          {errors.cpf_cnpj && (
            <p className="text-sm text-destructive">{errors.cpf_cnpj.message}</p>
          )}
        </div>

        {/* PJ: Razão Social */}
        {!isPF && (
          <div className="space-y-2">
            <Label htmlFor="razao_social">Razão Social *</Label>
            <Input
              id="razao_social"
              placeholder="Empresa Ltda."
              {...register('razao_social')}
            />
          </div>
        )}

        {/* PJ: Tipo de Empresa */}
        {!isPF && (
          <div className="space-y-2">
            <Label htmlFor="tipo_empresa">Tipo de Empresa</Label>
            <Input
              id="tipo_empresa"
              placeholder="Microempresa, ME, EIRELI..."
              {...register('tipo_empresa')}
            />
          </div>
        )}

        {/* PF: Gênero */}
        {isPF && (
          <div className="space-y-2">
            <Label htmlFor="genero">Gênero</Label>
            <Select
              defaultValue={client?.genero ?? undefined}
              onValueChange={(v) => setValue('genero', v as Genero)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {generoOptions.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Usado para concordância nos documentos gerados
            </p>
          </div>
        )}

        {/* PF: Data de Nascimento */}
        {isPF && (
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input id="birth_date" type="date" {...register('birth_date')} />
          </div>
        )}

        {/* PF: RG */}
        {isPF && (
          <div className="space-y-2">
            <Label htmlFor="rg">RG</Label>
            <Input id="rg" placeholder="12.345.678-9" {...register('rg')} />
          </div>
        )}

        {/* PF: Nacionalidade */}
        {isPF && (
          <div className="space-y-2">
            <Label htmlFor="nationality">Nacionalidade</Label>
            <Input
              id="nationality"
              placeholder="Brasileiro"
              {...register('nationality')}
            />
          </div>
        )}

        {/* PF: Profissão */}
        {isPF && (
          <div className="space-y-2">
            <Label htmlFor="profession">Profissão</Label>
            <Input
              id="profession"
              placeholder="Engenheiro"
              {...register('profession')}
            />
          </div>
        )}

        {/* PF: Estado Civil */}
        {isPF && (
          <div className="space-y-2">
            <Label>Estado Civil</Label>
            <Select
              defaultValue={client?.civil_status ?? undefined}
              onValueChange={(v) => setValue('civil_status', v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {civilStatusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="contato@exemplo.com"
            {...register('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            placeholder="(11) 98765-4321"
            {...register('phone')}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        {/* Endereço */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Endereço completo *</Label>
          <Input
            id="address"
            placeholder="Rua das Flores, 123, Bairro, Porto Velho, RO, 76800-000"
            {...register('address')}
            className={errors.address ? 'border-destructive' : ''}
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : client ? 'Atualizar Cliente' : 'Criar Cliente'}
        </Button>
        {!compact && (
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}

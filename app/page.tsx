'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
      }
      setLoading(false)
    }

    getUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">FG Gestão Jurídica</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Plataforma de gestão documental jurídica
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/dashboard">Ir para Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">FG Gestão Jurídica</h1>
          <div className="flex gap-4">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          {/* Hero Section */}
          <section className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Gestão Documental Jurídica Simplificada
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Plataforma SaaS interna para o escritório Ferreira Gomes Advocacia. 
                Gerenciamento eficiente de clientes, processos e geração automática de documentos.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">Começar agora</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/login">Fazer login</Link>
              </Button>
            </div>
          </section>

          {/* Features */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Gestão de Clientes</h3>
              <p className="text-muted-foreground">
                Cadastro e organização de clientes com suporte a CPF/CNPJ, dados pessoais e contato.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Biblioteca de Modelos</h3>
              <p className="text-muted-foreground">
                Upload de templates .docx com detecção automática de placeholders e preservação de formatação.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17.25c0 5.105 3.07 9.772 7.5 11.771m0-23.5c5.5 0 10 4.745 10 10.997v13m0-13c5.43-1.999 8.5-6.666 8.5-11.771 0-6.252-4.5-10.997-10-10.997z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Geração Automática</h3>
              <p className="text-muted-foreground">
                Preenchimento dinâmico de documentos com exportação em .docx e PDF com formatação ABNT.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

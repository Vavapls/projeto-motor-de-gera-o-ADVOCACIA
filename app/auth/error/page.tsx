'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4 text-center">
        <div className="space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Erro de autenticação</h1>
          <p className="text-muted-foreground">
            Ocorreu um erro durante o processo de autenticação. Tente novamente ou entre em contato com o suporte.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/auth/login">Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

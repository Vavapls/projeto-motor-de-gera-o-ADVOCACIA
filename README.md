# FG Gestão Jurídica

Plataforma SaaS de gestão documental jurídica para o escritório **Ferreira Gomes Advocacia**, desenvolvida com Next.js 16, React 19, TypeScript e Supabase PostgreSQL.

## 🎯 Visão Geral

Sistema completo de gestão de documentos jurídicos com funcionalidades de:
- **Gestão de Clientes**: CRUD de clientes com validação de CPF/CNPJ
- **Gestão de Processos**: Cadastro e organização de processos por categoria
- **Biblioteca de Modelos**: Upload de templates .docx com parsing automático de placeholders
- **Geração Dinâmica**: Preenchimento de documentos com dados de clientes
- **Exportação**: Geração de PDFs com formatação ABNT e timbrado do escritório
- **Auditoria**: Rastreamento completo de ações e versioning de documentos

## 🏗️ Arquitetura

### Stack Tecnológico
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Backend**: Next.js Route Handlers + Server Actions
- **Database**: Supabase PostgreSQL com RLS policies
- **Auth**: Supabase Auth (email/senha)
- **File Processing**: docxtemplater + pizzip (parsing .docx preservando formatação)
- **PDF Export**: Puppeteer (renderização server-side com CSS de impressão)
- **Form Management**: react-hook-form + Zod (validação)
- **Utilities**: date-fns, imask, axios

### Banco de Dados (Single-Tenant)

7 tabelas principais:

```
users                 → Usuários e roles (admin/colaborador)
law_firms            → Configuração singleton do escritório (margens, fonte, espaçamento)
clients              → Cadastro de clientes
processes            → Processos jurídicos (vinculados a clientes)
document_templates   → Biblioteca de modelos .docx com placeholders
generated_documents  → Histórico de documentos gerados (com versionamento)
audit_logs          → Rastreamento de ações (gerado/editado/exportado/deletado)
```

**Segurança**: RLS policies garantem isolamento de dados, cada usuário vê dados conforme sua permissão.

## 🚀 Como Começar

### Pré-requisitos
- Node.js 18+ e pnpm
- Conta Supabase com database PostgreSQL
- Variáveis de ambiente configuradas

### Instalação

1. **Clone/configure o projeto**:
   ```bash
   pnpm install
   ```

2. **Configure as variáveis de ambiente** no `.env.development.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
   ```

3. **Execute as migrações Supabase**:
   - O schema foi criado automaticamente via `supabase_apply_migration`
   - RLS policies e triggers também foram aplicados

4. **Inicie o servidor**:
   ```bash
   pnpm dev
   ```
   Acesse http://localhost:3000

## 📱 Fluxos Principais

### 1. Autenticação
- **Sign-up**: Criar conta com email/senha (requires email confirmation)
- **Login**: Email e senha
- **Roles**: Admin (gerencia configurações, cria usuários) vs Colaborador (usa o sistema)

### 2. Gestão de Clientes
1. Ir para **Dashboard → Clientes**
2. Clique em **"Novo cliente"**
3. Preencha formulário com validação de CPF/CNPJ
4. Salve e o cliente está disponível para vincular a documentos

### 3. Upload de Modelos (em desenvolvimento)
1. Preparar arquivo .docx com placeholders: `{{NOME_CAMPO}}`
2. Upload via **Dashboard → Modelos**
3. Sistema detecta automaticamente todos os placeholders
4. Confirme tipos de campos (texto, CPF, data, moeda, etc.)
5. Modelo fica disponível para gerar documentos

### 4. Gerar Documentos (em desenvolvimento)
1. **Dashboard → Documentos** → **Gerar Novo**
2. Selecione modelo e cliente (opcional)
3. Formulário dinâmico pre-preenche dados do cliente
4. Opção de **Salvar como Rascunho** durante preenchimento
5. Clique em **Confirmar** para finalizar
6. Sistema gera .docx e PDF automaticamente
7. Salva versão (v1, v2, v3...) com histórico

### 5. Exportação com Timbrado
- Cada documento exportado em PDF inclui:
  - **Header**: Logo, nome e OAB do escritório
  - **Margens**: Conforme config ABNT (padrão 3cm sup/esq, 2cm inf/dir)
  - **Fonte**: Times New Roman, espaçamento 1,5
  - **Rodapé**: Numeração de página

### 6. Auditoria
- **Dashboard → Auditoria** (em desenvolvimento)
- Veja todas as ações: quem, quando, qual documento, qual versão
- Rastreia: gerado, editado, exportado, deletado, salvo_como_rascunho

## 🔐 Segurança

- **RLS Policies**: Cada tabela com policies que respeitam `auth.uid()`
- **Server Actions**: Validações backend com Zod
- **Middleware**: Redireciona usuários não autenticados para `/auth/login`
- **Sem localStorage**: Dados sensíveis apenas no banco + cookies seguros

## 📦 Estrutura de Pastas

```
/app
  ├── layout.tsx              → Root layout com metadata
  ├── page.tsx                → Home com hero e features
  ├── auth/
  │   ├── login/              → Login page
  │   ├── sign-up/            → Sign up page
  │   ├── sign-up-success/    → Confirmação de email
  │   ├── error/              → Página de erro auth
  │   └── callback/           → Callback Supabase Auth
  ├── dashboard/
  │   ├── layout.tsx          → Layout com sidebar navigation
  │   ├── page.tsx            → Dashboard overview
  │   ├── clients/
  │   │   ├── page.tsx        → Lista de clientes
  │   │   ├── new/            → Formulário novo cliente
  │   │   └── [id]/           → Editar cliente
  │   ├── processes/          → Placeholder (em dev)
  │   ├── templates/          → Placeholder (em dev)
  │   ├── documents/          → Placeholder (em dev)
  │   └── settings/           → Placeholder (em dev)

/components
  ├── ui/                     → shadcn/ui components
  ├── client-form.tsx         → Formulário CRUD clientes
  ├── clients-list.tsx        → Tabela com filtro/busca

/lib
  ├── supabase/
  │   ├── client.ts           → Browser Supabase client
  │   ├── server.ts           → Server Supabase client
  │   └── proxy.ts            → Session middleware
  ├── services/
  │   └── clients.ts          → Server actions para clientes
  ├── types.ts                → TypeScript interfaces
  └── utils/
      └── format.ts           → Formatação (CPF, moeda, data, etc)

/middleware.ts                 → Auth middleware para rotas protegidas
```

## 🛠️ Desenvolvimento Futuro

As seguintes tarefas estão em andamento:

### Fase 4: Biblioteca de Modelos
- [ ] Componente de upload de .docx
- [ ] Parsing automático de placeholders {{CAMPO}}
- [ ] Detecção de tipos de campos (CPF, data, moeda)
- [ ] Interface de revisão e ajuste de campos
- [ ] Salvar metadados de template em JSONB

### Fase 5: Geração Dinâmica
- [ ] Formulário dinâmico baseado em template
- [ ] Auto-preenchimento com dados de cliente
- [ ] Validação em tempo real
- [ ] Salvar como rascunho (status='rascunho')
- [ ] Preview de documento

### Fase 6: Exportação
- [ ] Integração docxtemplater para substituição de placeholders
- [ ] Geração de .docx final preservando formatação
- [ ] Integração Puppeteer para renderizar HTML → PDF
- [ ] Aplicar timbrado (header com logo/OAB)
- [ ] Aplicar margens e espaçamento ABNT

### Fase 7: Auditoria + Configurações
- [ ] Página de auditoria com filtros
- [ ] Painel de configurações para admin
- [ ] Gerenciar logo, OAB, endereço, telefone, email
- [ ] Ajustar margens e espaçamento de PDF
- [ ] Criar usuários colaboradores

## 🔧 Scripts úteis

```bash
# Desenvolvimento
pnpm dev                    # Inicia servidor em http://localhost:3000

# Build/Deploy
pnpm build                  # Build para produção
pnpm start                  # Inicia servidor produção

# Linting
pnpm lint                   # ESLint + TypeScript check

# Dependências
pnpm add <package>          # Instalar pacote
pnpm remove <package>       # Remover pacote
```

## 📚 Referências

- [Next.js 16 Docs](https://nextjs.org)
- [React 19 Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [docxtemplater](https://docxtemplater.com)
- [Puppeteer](https://pptr.dev)

## 🤝 Contribuindo

Este é um projeto interno do escritório Ferreira Gomes Advocacia. Para sugestões ou bugs, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Proprietário - Ferreira Gomes Advocacia

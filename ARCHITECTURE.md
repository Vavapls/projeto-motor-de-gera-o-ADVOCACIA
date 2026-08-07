# 🏗️ Arquitetura do FG Gestão Jurídica

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Pages:  Auth | Dashboard | Clients | Templates | Docs │  │
│  │  Components: Forms | Lists | Layouts | UI Widgets       │  │
│  │  Styling: Tailwind v4 + shadcn/ui                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Server Actions:  clients | templates | documents       │  │
│  │  API Routes: upload | generate (WIP)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Supabase Client)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Supabase)                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Auth: email/password + JWT sessions                     │  │
│  │ RLS Policies: Row-level security em todas as tabelas    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ DATABASE (PostgreSQL):                                  │  │
│  │  • users                    • clients                   │  │
│  │  • law_firms (singleton)    • processes                │  │
│  │  • document_templates       • generated_documents       │  │
│  │  • audit_logs                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Storage: Bucket para .docx e PDFs gerados              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Diretórios

```
/app
├── auth/                      # Autenticação
│   ├── login/
│   ├── sign-up/
│   ├── sign-up-success/
│   └── error/
├── dashboard/                 # Área autenticada
│   ├── layout.tsx            # Sidebar + header
│   ├── page.tsx              # Overview
│   ├── clients/
│   │   ├── page.tsx          # Listagem
│   │   ├── new/page.tsx      # Novo cliente
│   │   └── [id]/page.tsx     # Detalhes (WIP)
│   ├── processes/            # Placeholder
│   ├── templates/            # Gestão de modelos
│   │   ├── page.tsx
│   │   └── upload/page.tsx
│   ├── documents/            # Gestão de documentos
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   └── settings/             # Configurações
├── actions/                   # Server Actions
│   ├── clients.ts            # CRUD de clientes
│   ├── templates.ts          # CRUD de templates
│   └── documents.ts          # CRUD de documentos
└── api/                       # API Routes (WIP)
    └── upload/               # Upload de .docx

/components
├── client-form.tsx           # Form de novo/editar cliente
├── clients-list.tsx          # Tabela de clientes
├── template-upload.tsx       # Upload de modelos
└── ui/                       # shadcn/ui components

/lib
├── supabase/
│   ├── client.ts            # Client-side instance
│   └── server.ts            # Server-side instance
├── services/
│   ├── clients.ts           # Queries de clientes
│   ├── templates.ts         # Queries de templates
│   └── documents.ts         # Queries de documentos
├── utils/
│   ├── format.ts            # CPF, CNPJ, phone formatting
│   ├── docx-parser.ts       # Parsing de .docx
│   └── validators.ts        # Validações (WIP)
└── types.ts                 # TypeScript types

/public
├── favicon.ico
└── images/

/db
└── migrations/              # Migrações do Supabase
```

---

## 🔄 Fluxos Principais

### 1️⃣ Autenticação

```
Usuário preenche Sign-up
    ↓
POST /auth/sign-up
    ↓
Supabase Auth cria user + envia email
    ↓
Usuário confirma email
    ↓
Login com email/senha
    ↓
JWT gerado
    ↓
Session criada
    ↓
Middleware valida token
    ↓
Acesso ao /dashboard ✅
```

### 2️⃣ Criação de Cliente

```
Usuário clica "Novo Cliente"
    ↓
Formulário com campos vazios
    ↓
Usuário preenche dados
    ↓
Validação Zod no cliente
    ↓
Clica "Criar Cliente"
    ↓
Chama Server Action: createClientAction()
    ↓
Server obtém user.id do JWT
    ↓
Insere em DB com created_by_id = user.id
    ↓
RLS Policy valida acesso (auth.uid() = created_by_id)
    ↓
Retorna sucesso
    ↓
Redireciona para /dashboard/clients
    ↓
Lista renderiza com novo cliente ✅
```

### 3️⃣ Upload e Processamento de Modelo (WIP)

```
Usuário acessa /dashboard/templates/upload
    ↓
Seleciona arquivo .docx
    ↓
POST /api/upload
    ↓
docx-parser extrai placeholders {{CAMPO}}
    ↓
Deduplicação automática
    ↓
Inferência de tipo (CPF→cpf, DATA→date)
    ↓
Salva template no banco com placeholder_json
    ↓
Armazena arquivo em Supabase Storage
    ↓
Redireciona para visualização ✅
```

### 4️⃣ Geração de Documento (WIP)

```
Usuário clica "Novo Documento"
    ↓
Seleciona cliente + template
    ↓
Sistema monta formulário dinâmico com {{PLACEHOLDERS}}
    ↓
Pré-preenche com dados do cliente
    ↓
Usuário preenche campos adicionais
    ↓
Clica "Salvar como Rascunho" ou "Finalizar"
    ↓
Server Action substitui placeholders com valores
    ↓
Gera .docx via docxtemplater
    ↓
Salva em Storage
    ↓
Salva registro em generated_documents (com versionamento)
    ↓
Redireciona para documento criado ✅
```

### 5️⃣ Exportação para PDF (WIP)

```
Usuário clica "Exportar para PDF"
    ↓
POST /api/generate-pdf {documentId}
    ↓
Server busca documento + dados preenchidos
    ↓
Aplica margens/fonte da configuração
    ↓
Puppeteer renderiza HTML → PDF
    ↓
Aplica assinatura digital (se configurado)
    ↓
Salva PDF em Storage
    ↓
Retorna URL de download
    ↓
Usuário faz download ✅
```

---

## 🛡️ Segurança

### RLS Policies

Cada tabela tem policies que garantem:
- ✅ Usuários só veem seus próprios dados
- ✅ Admins podem ver/editar tudo
- ✅ Criador pode editar seus próprios registros
- ✅ Deletar requer permissão especial

### Server Actions

- ✅ Executam no servidor (dados sensíveis protegidos)
- ✅ Validação Zod antes de inserir
- ✅ Obtenção automática de `user.id` do JWT
- ✅ Erros mascarados para o cliente

### Middleware

- ✅ Bloqueia rotas `/dashboard/*` sem autenticação
- ✅ Redireciona para `/auth/login`
- ✅ Valida JWT de sessão

---

## 📊 Entity Relationship Diagram

```sql
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │ ─────┐
│ full_name       │      │
│ role            │      │
│ created_at      │      │
└─────────────────┘      │
                         │
        ┌────────────────┴─────────────────┐
        │                                  │
        ▼                                  ▼
┌─────────────────┐              ┌──────────────────┐
│    clients      │              │ document_templates│
├─────────────────┤              ├──────────────────┤
│ id (PK)         │              │ id (PK)          │
│ full_name       │              │ name             │
│ cpf_cnpj        │              │ placeholder_json │
│ created_by_id ──┼──FK          │ created_by_id ───┼──FK
│ created_at      │              │ created_at       │
└─────────────────┘              └──────────────────┘
        │                               │
        │   ┌───────────────────────────┘
        │   │
        ▼   ▼
    ┌──────────────────┐
    │ generated_documents│
    ├──────────────────┤
    │ id (PK)          │
    │ client_id ────────┼──FK
    │ template_id ──────┼──FK
    │ document_number   │ (v1, v2, v3...)
    │ parent_document_id│ (versionamento)
    │ filled_data       │ (JSONB)
    │ docx_url          │
    │ pdf_url           │
    │ status            │
    │ created_at        │
    └──────────────────┘

Também têm:
- law_firms (singleton, config do escritório)
- processes (processos judiciais)
- audit_logs (rastreamento de ações)
```

---

## 🚀 Deploy Checklist

- [ ] Configurar SMTP para email confirmation
- [ ] Adicionar Supabase Storage bucket public
- [ ] Configurar variáveis de ambiente (Vercel)
- [ ] Rotas de API para upload e geração
- [ ] Validação real de CPF integrada
- [ ] Assinatura digital (opcional)
- [ ] Testes end-to-end
- [ ] Monitoring e logging
- [ ] Backup automático do banco

---

## 📈 Performance Otimizations

✅ Implementadas:
- Índices em colunas frequentemente consultadas
- RLS com queries otimizadas
- Client-side search com Zod validation
- Lazy loading de componentes

⏳ Pendentes:
- Cache com SWR
- Paginação de tabelas grandes
- Compressão de PDFs
- CDN para Storage

---

## 🧪 Testes

```
✅ Testes Manuais Realizados:
   • Autenticação (sign-up, login, logout)
   • CRUD de clientes
   • Busca e filtro
   • Configurações do escritório

⏳ Testes Ainda Necessários:
   • Upload de modelos
   • Geração de documentos
   • Exportação para .docx
   • Exportação para PDF
   • RLS policies com múltiplos usuários
   • Versionamento de documentos
```

---

## 📝 Documentação Adicional

- **VERIFICATION_REPORT.md** - Relatório completo de testes
- **README.md** - Setup e instruções de desenvolvimento
- Inline comments no código explicando lógica complexa

---

**Status**: 🟢 CORE FUNCIONAL | 🟡 FEATURES PARCIAIS | 🔴 EXPORTAÇÃO PENDENTE

*Última atualização: 31/07/2026*

-- =============================================================
-- Migração: Fase 2 + 3 + 4 — Correções de risco pré-motor documental
-- Executar no SQL Editor do Supabase (ou via supabase db push)
-- =============================================================

-- -------------------------------------------------------------
-- TAREFA 2: FK real entre atendimentos e processes
-- Mantém process_number como campo legado (Opção A)
-- Regra de prioridade: process_id preenchido → usa o join;
--   process_id null → usa o campo texto.
-- -------------------------------------------------------------

ALTER TABLE atendimentos
  ADD COLUMN IF NOT EXISTS process_id uuid REFERENCES processes(id) ON DELETE SET NULL;

-- Índice para facilitar joins
CREATE INDEX IF NOT EXISTS idx_atendimentos_process_id ON atendimentos(process_id);

-- Quando process_id é preenchido, limpa o campo legado para evitar ambiguidade
-- (o código já faz isso no insert; o constraint reforça no banco)
ALTER TABLE atendimentos
  ADD CONSTRAINT chk_atendimento_process_xor
  CHECK (
    -- Se process_id preenchido, process_number deve ser null
    -- Se process_id null, process_number pode ser qualquer coisa
    NOT (process_id IS NOT NULL AND process_number IS NOT NULL)
  );

-- RLS: já herda a policy existente de atendimentos (usuário vê apenas os seus).
-- Nenhuma policy adicional necessária.

-- -------------------------------------------------------------
-- TAREFA 3: Soft delete — coluna deleted_at nas 3 tabelas
-- -------------------------------------------------------------

-- clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Índice parcial: acelera as queries que filtram deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(created_at)
  WHERE deleted_at IS NULL;

-- document_templates
ALTER TABLE document_templates
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(created_at)
  WHERE deleted_at IS NULL;

-- generated_documents
ALTER TABLE generated_documents
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_generated_documents_active ON generated_documents(created_at)
  WHERE deleted_at IS NULL;

-- -------------------------------------------------------------
-- TAREFA 4: Storage bucket privado para templates .docx
--
-- ATENÇÃO: bucket e policies de storage NÃO podem ser criados via SQL puro.
-- Execute os passos abaixo no Dashboard do Supabase:
--
-- 4.1) Vá em Storage → New bucket
--      Name: document-templates
--      Public: NÃO (deixar desmarcado)
--      File size limit: 10 MB (ajuste conforme necessário)
--      Allowed MIME types: application/vnd.openxmlformats-officedocument.wordprocessingml.document
--
-- 4.2) Após criar o bucket, vá em Policies → document-templates
--      Crie as seguintes policies (RLS de Storage):
--
-- Policy: SELECT (download) — apenas o dono do arquivo
-- Nome: "Authenticated users can download their own templates"
-- Operação: SELECT
-- Expressão: (auth.uid()::text = (storage.foldername(name))[1])
--
-- Policy: INSERT (upload) — apenas autenticado, no próprio diretório
-- Nome: "Authenticated users can upload to their folder"
-- Operação: INSERT
-- Expressão: (auth.uid()::text = (storage.foldername(name))[1])
--
-- Policy: DELETE — apenas o dono
-- Nome: "Authenticated users can delete their own templates"
-- Operação: DELETE
-- Expressão: (auth.uid()::text = (storage.foldername(name))[1])
--
-- A expressão (storage.foldername(name))[1] extrai o primeiro segmento do path,
-- que no nosso caso é o user_id (ex: "abc123/1234567890_Modelo.docx" → "abc123").
-- -------------------------------------------------------------

-- Verificação: confirmar que as colunas foram adicionadas corretamente
DO $$
BEGIN
  ASSERT (SELECT column_name FROM information_schema.columns
          WHERE table_name = 'atendimentos' AND column_name = 'process_id') IS NOT NULL,
    'FALHA: coluna process_id não encontrada em atendimentos';

  ASSERT (SELECT column_name FROM information_schema.columns
          WHERE table_name = 'clients' AND column_name = 'deleted_at') IS NOT NULL,
    'FALHA: coluna deleted_at não encontrada em clients';

  ASSERT (SELECT column_name FROM information_schema.columns
          WHERE table_name = 'document_templates' AND column_name = 'deleted_at') IS NOT NULL,
    'FALHA: coluna deleted_at não encontrada em document_templates';

  ASSERT (SELECT column_name FROM information_schema.columns
          WHERE table_name = 'generated_documents' AND column_name = 'deleted_at') IS NOT NULL,
    'FALHA: coluna deleted_at não encontrada em generated_documents';

  RAISE NOTICE 'Migração validada com sucesso.';
END $$;

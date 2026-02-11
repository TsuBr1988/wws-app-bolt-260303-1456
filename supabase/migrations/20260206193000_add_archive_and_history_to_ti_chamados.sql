/*
  # Arquivamento e histórico de comentários (TI Chamados)

  1. Alterações na tabela ti_chamados
    - Adiciona `arquivado` (boolean) para soft-delete/arquivamento
    - Adiciona `data_arquivamento` (timestamptz) para auditoria simples
    - Adiciona `historico` (jsonb) para armazenar comentários/eventos no próprio registro

  Observação:
    - Mudanças são idempotentes (IF NOT EXISTS)
*/

ALTER TABLE ti_chamados
  ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_arquivamento timestamptz,
  ADD COLUMN IF NOT EXISTS historico jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_ti_chamados_arquivado ON ti_chamados(arquivado);

/*
  # Adicionar campo estimativa aos chamados de TI

  1. Alterações na tabela ti_chamados
    - Adicionar coluna `estimativa` (integer) - Estimativa de esforço (fibonacci: 1, 2, 3, 5, 8)
*/

ALTER TABLE ti_chamados
  ADD COLUMN IF NOT EXISTS estimativa integer CHECK (estimativa IN (1, 2, 3, 5, 8));

CREATE INDEX IF NOT EXISTS idx_ti_chamados_estimativa ON ti_chamados(estimativa);

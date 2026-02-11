/*
  # Adicionar campos de pilares ao plano estratégico

  1. Mudanças
    - Adiciona 5 campos de texto (pilar1, pilar2, pilar3, pilar4, pilar5) à tabela strategic_plan
    - Permite armazenar os 5 pilares estratégicos da organização
*/

-- Adicionar campos de pilares
ALTER TABLE strategic_plan
ADD COLUMN IF NOT EXISTS pilar1 text,
ADD COLUMN IF NOT EXISTS pilar2 text,
ADD COLUMN IF NOT EXISTS pilar3 text,
ADD COLUMN IF NOT EXISTS pilar4 text,
ADD COLUMN IF NOT EXISTS pilar5 text;

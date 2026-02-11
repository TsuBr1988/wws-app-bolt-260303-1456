/*
  # Adicionar campo data_pregao na tabela proposals

  1. Nova Coluna
    - `data_pregao` (timestamptz) - Data e hora específica do pregão/licitação
    
  2. Migração de Dados
    - Copiar valores existentes de created_at para data_pregao
    - Isso mantém compatibilidade com dados existentes
    
  3. Índices
    - Adicionar índice para consultas por data do pregão
*/

-- Adicionar campo data_pregao
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS data_pregao timestamptz;

-- Migrar dados existentes (copiar created_at para data_pregao onde não estiver preenchido)
UPDATE proposals 
SET data_pregao = created_at 
WHERE data_pregao IS NULL;

-- Criar índice para otimizar consultas por data do pregão
CREATE INDEX IF NOT EXISTS idx_proposals_data_pregao 
ON proposals (data_pregao);
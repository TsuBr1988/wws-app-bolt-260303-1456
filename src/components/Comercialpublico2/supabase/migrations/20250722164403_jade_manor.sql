/*
  # Adicionar cargos Promotor e Orçamentista

  1. Novos Cargos
    - Adiciona 'Promotor' e 'Orcamentista' ao enum employee_role
    - Permite criação de funcionários com esses cargos

  2. Novas Colunas em Proposals
    - `promotor_id` (uuid, opcional) - Referencia employees(id)
    - `orcamentista_id` (uuid, opcional) - Referencia employees(id)
    
  3. Chaves Estrangeiras
    - FK de promotor_id para employees(id)
    - FK de orcamentista_id para employees(id)
    
  4. Lógica de Negócio
    - Licitações com promotor: comissão fixa 0,1% (não conta para metas)
    - Licitações sem promotor: lógica de comissão normal (conta para metas)
*/

-- Adicionar novos valores ao enum employee_role
ALTER TYPE employee_role ADD VALUE IF NOT EXISTS 'Promotor';
ALTER TYPE employee_role ADD VALUE IF NOT EXISTS 'Orcamentista';

-- Adicionar novas colunas à tabela proposals
DO $$
BEGIN
  -- Adicionar coluna promotor_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'promotor_id'
  ) THEN
    ALTER TABLE proposals ADD COLUMN promotor_id uuid REFERENCES employees(id);
  END IF;

  -- Adicionar coluna orcamentista_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'orcamentista_id'
  ) THEN
    ALTER TABLE proposals ADD COLUMN orcamentista_id uuid REFERENCES employees(id);
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_proposals_promotor ON proposals(promotor_id);
CREATE INDEX IF NOT EXISTS idx_proposals_orcamentista ON proposals(orcamentista_id);

-- Comentários para documentação
COMMENT ON COLUMN proposals.promotor_id IS 'ID do funcionário Promotor responsável pela licitação (opcional)';
COMMENT ON COLUMN proposals.orcamentista_id IS 'ID do funcionário Orçamentista responsável pela licitação (opcional)';
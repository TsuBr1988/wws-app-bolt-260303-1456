/*
  # Corrigir lógica da data de fechamento

  1. Correções
    - Data de fechamento APENAS para status "Fechado"
    - Data de perda APENAS para status "Perdido"
    - Campos condicionais baseados no status

  2. Constraints
    - closing_date obrigatória APENAS quando status = 'Fechado'
    - lost_date e lost_reason obrigatórios APENAS quando status = 'Perdido'
    - Outros status não precisam de campos extras
*/

-- Remover constraints antigas que podem estar causando problemas
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_closing_date_check;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_lost_date_check;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_lost_reason_check;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS check_closing_date_when_closed;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS check_lost_fields_when_lost;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS check_valid_lost_reason;

-- Adicionar colunas se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proposals' AND column_name = 'closing_date') THEN
        ALTER TABLE proposals ADD COLUMN closing_date timestamptz;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proposals' AND column_name = 'lost_date') THEN
        ALTER TABLE proposals ADD COLUMN lost_date timestamptz;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proposals' AND column_name = 'lost_reason') THEN
        ALTER TABLE proposals ADD COLUMN lost_reason text;
    END IF;
END $$;

-- Limpar dados inconsistentes baseado no status atual
UPDATE proposals SET 
    closing_date = NULL,
    lost_date = NULL,
    lost_reason = NULL
WHERE status NOT IN ('Fechado', 'Perdido');

-- Para propostas fechadas sem data de fechamento, usar updated_at como padrão
UPDATE proposals SET 
    closing_date = COALESCE(closing_date, updated_at),
    lost_date = NULL,
    lost_reason = NULL
WHERE status = 'Fechado';

-- Para propostas perdidas sem data de perda, usar updated_at como padrão
UPDATE proposals SET 
    lost_date = COALESCE(lost_date, updated_at),
    lost_reason = COALESCE(lost_reason, 'Fechou com concorrente'),
    closing_date = NULL
WHERE status = 'Perdido';

-- Constraint: closing_date obrigatória APENAS quando status = 'Fechado'
ALTER TABLE proposals 
ADD CONSTRAINT check_closing_date_when_closed 
CHECK (
  (status = 'Fechado' AND closing_date IS NOT NULL) OR 
  (status != 'Fechado' AND closing_date IS NULL)
);

-- Constraint: lost_date e lost_reason obrigatórios APENAS quando status = 'Perdido'
ALTER TABLE proposals 
ADD CONSTRAINT check_lost_fields_when_lost 
CHECK (
  (status = 'Perdido' AND lost_date IS NOT NULL AND lost_reason IS NOT NULL) OR 
  (status != 'Perdido' AND lost_date IS NULL AND lost_reason IS NULL)
);

-- Constraint: motivos válidos para perda
ALTER TABLE proposals 
ADD CONSTRAINT check_valid_lost_reason 
CHECK (
  lost_reason IS NULL OR 
  lost_reason IN ('Fechou com o atual', 'Fechou com concorrente', 'Desistiu da contratação')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_proposals_closing_date ON proposals(closing_date) WHERE closing_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_lost_date ON proposals(lost_date) WHERE lost_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_status_dates ON proposals(status, closing_date, lost_date);

-- Comentários para documentação
COMMENT ON COLUMN proposals.closing_date IS 'Data de fechamento do contrato (obrigatória APENAS para status Fechado)';
COMMENT ON COLUMN proposals.lost_date IS 'Data da perda da proposta (obrigatória APENAS para status Perdido)';
COMMENT ON COLUMN proposals.lost_reason IS 'Motivo da perda (obrigatório APENAS para status Perdido)';
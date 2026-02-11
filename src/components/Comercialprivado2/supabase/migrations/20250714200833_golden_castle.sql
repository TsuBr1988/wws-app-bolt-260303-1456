/*
  # Corrigir colunas para propostas perdidas e fechadas

  1. Verificar e adicionar colunas necessárias
    - `closing_date` (timestamptz) - Data de fechamento do contrato
    - `lost_date` (timestamptz) - Data que perdemos a proposta  
    - `lost_reason` (text) - Motivo da perda

  2. Remover constraints antigas se existirem
  3. Adicionar novas constraints corretas
  4. Criar índices para performance
*/

-- Remover constraints antigas se existirem
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS check_closing_date_when_closed;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS check_lost_fields_when_lost;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS check_valid_lost_reason;

-- Adicionar colunas se não existirem
DO $$ 
BEGIN
    -- Adicionar closing_date se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proposals' AND column_name = 'closing_date'
    ) THEN
        ALTER TABLE proposals ADD COLUMN closing_date timestamptz;
    END IF;

    -- Adicionar lost_date se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proposals' AND column_name = 'lost_date'
    ) THEN
        ALTER TABLE proposals ADD COLUMN lost_date timestamptz;
    END IF;

    -- Adicionar lost_reason se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proposals' AND column_name = 'lost_reason'
    ) THEN
        ALTER TABLE proposals ADD COLUMN lost_reason text;
    END IF;
END $$;

-- Adicionar constraints de validação
ALTER TABLE proposals 
ADD CONSTRAINT check_closing_date_when_closed 
CHECK (
  (status = 'Fechado' AND closing_date IS NOT NULL) OR 
  (status != 'Fechado')
);

ALTER TABLE proposals 
ADD CONSTRAINT check_lost_fields_when_lost 
CHECK (
  (status = 'Perdido' AND lost_date IS NOT NULL AND lost_reason IS NOT NULL) OR 
  (status != 'Perdido')
);

ALTER TABLE proposals 
ADD CONSTRAINT check_valid_lost_reason 
CHECK (
  lost_reason IS NULL OR 
  lost_reason IN ('Fechou com o atual', 'Fechou com concorrente', 'Desistiu da contratação')
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_proposals_closing_date ON proposals(closing_date);
CREATE INDEX IF NOT EXISTS idx_proposals_lost_date ON proposals(lost_date);
CREATE INDEX IF NOT EXISTS idx_proposals_status_closing_date ON proposals(status, closing_date);

-- Comentários para documentação
COMMENT ON COLUMN proposals.closing_date IS 'Data em que o contrato foi efetivamente fechado (apenas para status Fechado)';
COMMENT ON COLUMN proposals.lost_date IS 'Data em que perdemos a proposta (apenas para status Perdido)';
COMMENT ON COLUMN proposals.lost_reason IS 'Motivo pelo qual perdemos a proposta (apenas para status Perdido)';
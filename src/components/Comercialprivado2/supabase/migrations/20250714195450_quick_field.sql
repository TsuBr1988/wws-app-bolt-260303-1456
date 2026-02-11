/*
  # Corrigir violação de constraint no Supabase

  1. Problema
    - Constraint existente está conflitando com dados atuais
    - Precisa remover constraints antigas antes de criar novas

  2. Solução
    - Remover todas as constraints relacionadas
    - Limpar dados inconsistentes
    - Recriar constraints corretas
    - Adicionar colunas se necessário
*/

-- 1. REMOVER TODAS AS CONSTRAINTS RELACIONADAS (se existirem)
DO $$ 
BEGIN
    -- Remover constraint de closing_date se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'proposals_closing_date_check' 
        AND table_name = 'proposals'
    ) THEN
        ALTER TABLE proposals DROP CONSTRAINT proposals_closing_date_check;
    END IF;

    -- Remover outras constraints relacionadas se existirem
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_closing_date_when_closed' 
        AND table_name = 'proposals'
    ) THEN
        ALTER TABLE proposals DROP CONSTRAINT check_closing_date_when_closed;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_lost_fields_when_lost' 
        AND table_name = 'proposals'
    ) THEN
        ALTER TABLE proposals DROP CONSTRAINT check_lost_fields_when_lost;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_valid_lost_reason' 
        AND table_name = 'proposals'
    ) THEN
        ALTER TABLE proposals DROP CONSTRAINT check_valid_lost_reason;
    END IF;
END $$;

-- 2. ADICIONAR COLUNAS SE NÃO EXISTIREM
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

-- 3. LIMPAR DADOS INCONSISTENTES
-- Definir closing_date para propostas fechadas que não têm data
UPDATE proposals 
SET closing_date = updated_at 
WHERE status = 'Fechado' AND closing_date IS NULL;

-- Definir lost_date para propostas perdidas que não têm data
UPDATE proposals 
SET lost_date = updated_at 
WHERE status = 'Perdido' AND lost_date IS NULL;

-- Definir lost_reason padrão para propostas perdidas que não têm motivo
UPDATE proposals 
SET lost_reason = 'Fechou com concorrente' 
WHERE status = 'Perdido' AND lost_reason IS NULL;

-- Limpar campos desnecessários baseado no status
UPDATE proposals SET closing_date = NULL WHERE status != 'Fechado';
UPDATE proposals SET lost_date = NULL WHERE status != 'Perdido';
UPDATE proposals SET lost_reason = NULL WHERE status != 'Perdido';

-- 4. CRIAR CONSTRAINTS CORRETAS (após limpar dados)
-- Constraint: closing_date obrigatória quando status = 'Fechado'
ALTER TABLE proposals 
ADD CONSTRAINT check_closing_date_when_closed 
CHECK (
  (status = 'Fechado' AND closing_date IS NOT NULL) OR 
  (status != 'Fechado' AND closing_date IS NULL)
);

-- Constraint: lost_date e lost_reason obrigatórios quando status = 'Perdido'
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

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_proposals_closing_date ON proposals(closing_date) WHERE closing_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_lost_date ON proposals(lost_date) WHERE lost_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_status_dates ON proposals(status, closing_date, lost_date);

-- 6. ADICIONAR COMENTÁRIOS
COMMENT ON COLUMN proposals.closing_date IS 'Data em que o contrato foi efetivamente fechado (apenas para status Fechado)';
COMMENT ON COLUMN proposals.lost_date IS 'Data em que perdemos a proposta (apenas para status Perdido)';
COMMENT ON COLUMN proposals.lost_reason IS 'Motivo pelo qual perdemos a proposta (apenas para status Perdido)';

-- 7. VERIFICAR SE TUDO ESTÁ CORRETO
DO $$ 
BEGIN
    RAISE NOTICE 'Migração concluída com sucesso!';
    RAISE NOTICE 'Colunas adicionadas: closing_date, lost_date, lost_reason';
    RAISE NOTICE 'Constraints criadas para garantir consistência de dados';
    RAISE NOTICE 'Dados existentes foram limpos e padronizados';
END $$;
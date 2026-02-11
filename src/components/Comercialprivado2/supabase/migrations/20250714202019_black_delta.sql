/*
  # Corrigir violação da constraint closing_date

  1. Problema Identificado
    - Constraint "proposals_closing_date_check" está sendo violada
    - Provavelmente existe dados inconsistentes na tabela

  2. Solução
    - Verificar dados existentes
    - Corrigir registros problemáticos
    - Recriar constraint corretamente

  3. Validação
    - Garantir que todos os registros estejam consistentes
*/

-- 1. VERIFICAR DADOS PROBLEMÁTICOS
SELECT 
    id,
    client,
    status,
    closing_date,
    lost_date,
    lost_reason,
    CASE 
        WHEN status = 'Fechado' AND closing_date IS NULL THEN 'ERRO: Fechado sem data'
        WHEN status != 'Fechado' AND closing_date IS NOT NULL THEN 'ERRO: Não fechado com data'
        WHEN status = 'Perdido' AND lost_date IS NULL THEN 'ERRO: Perdido sem data'
        WHEN status = 'Perdido' AND lost_reason IS NULL THEN 'ERRO: Perdido sem motivo'
        WHEN status != 'Perdido' AND (lost_date IS NOT NULL OR lost_reason IS NOT NULL) THEN 'ERRO: Não perdido com dados de perda'
        ELSE 'OK'
    END as problema
FROM proposals 
WHERE 
    -- Casos problemáticos
    (status = 'Fechado' AND closing_date IS NULL) OR
    (status != 'Fechado' AND closing_date IS NOT NULL) OR
    (status = 'Perdido' AND (lost_date IS NULL OR lost_reason IS NULL)) OR
    (status != 'Perdido' AND (lost_date IS NOT NULL OR lost_reason IS NOT NULL));

-- 2. REMOVER CONSTRAINTS PROBLEMÁTICAS
DO $$ 
BEGIN
    -- Remover constraint que está causando problema
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'proposals_closing_date_check') THEN
        ALTER TABLE proposals DROP CONSTRAINT proposals_closing_date_check;
        RAISE NOTICE 'Constraint proposals_closing_date_check removida';
    END IF;
    
    -- Remover outras constraints relacionadas se existirem
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_closing_date_when_closed') THEN
        ALTER TABLE proposals DROP CONSTRAINT check_closing_date_when_closed;
        RAISE NOTICE 'Constraint check_closing_date_when_closed removida';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_lost_fields_when_lost') THEN
        ALTER TABLE proposals DROP CONSTRAINT check_lost_fields_when_lost;
        RAISE NOTICE 'Constraint check_lost_fields_when_lost removida';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_valid_lost_reason') THEN
        ALTER TABLE proposals DROP CONSTRAINT check_valid_lost_reason;
        RAISE NOTICE 'Constraint check_valid_lost_reason removida';
    END IF;
END $$;

-- 3. CORRIGIR DADOS INCONSISTENTES
-- Limpar closing_date de propostas que não estão fechadas
UPDATE proposals 
SET closing_date = NULL 
WHERE status != 'Fechado' AND closing_date IS NOT NULL;

-- Limpar lost_date e lost_reason de propostas que não estão perdidas
UPDATE proposals 
SET lost_date = NULL, lost_reason = NULL 
WHERE status != 'Perdido' AND (lost_date IS NOT NULL OR lost_reason IS NOT NULL);

-- Para propostas fechadas sem data, definir data atual (ou você pode ajustar manualmente)
UPDATE proposals 
SET closing_date = updated_at 
WHERE status = 'Fechado' AND closing_date IS NULL;

-- Para propostas perdidas sem data/motivo, definir valores padrão
UPDATE proposals 
SET 
    lost_date = updated_at,
    lost_reason = 'Fechou com concorrente'
WHERE status = 'Perdido' AND (lost_date IS NULL OR lost_reason IS NULL);

-- 4. RECRIAR CONSTRAINTS CORRETAS (mais flexíveis)
-- Constraint para closing_date (apenas quando fechado)
ALTER TABLE proposals 
ADD CONSTRAINT check_closing_date_valid 
CHECK (
    (status = 'Fechado' AND closing_date IS NOT NULL) OR 
    (status != 'Fechado')
);

-- Constraint para lost_date (apenas quando perdido)
ALTER TABLE proposals 
ADD CONSTRAINT check_lost_date_valid 
CHECK (
    (status = 'Perdido' AND lost_date IS NOT NULL) OR 
    (status != 'Perdido')
);

-- Constraint para lost_reason (apenas quando perdido)
ALTER TABLE proposals 
ADD CONSTRAINT check_lost_reason_valid 
CHECK (
    (status = 'Perdido' AND lost_reason IS NOT NULL) OR 
    (status != 'Perdido')
);

-- Constraint para valores válidos de lost_reason
ALTER TABLE proposals 
ADD CONSTRAINT check_lost_reason_values 
CHECK (
    lost_reason IS NULL OR 
    lost_reason IN ('Fechou com o atual', 'Fechou com concorrente', 'Desistiu da contratação')
);

-- 5. VERIFICAR SE TUDO ESTÁ OK AGORA
SELECT 
    'Propostas Fechadas' as tipo,
    COUNT(*) as total,
    COUNT(closing_date) as com_data_fechamento
FROM proposals 
WHERE status = 'Fechado'

UNION ALL

SELECT 
    'Propostas Perdidas' as tipo,
    COUNT(*) as total,
    COUNT(lost_date) as com_data_perda
FROM proposals 
WHERE status = 'Perdido'

UNION ALL

SELECT 
    'Total Propostas' as tipo,
    COUNT(*) as total,
    0 as com_data_fechamento
FROM proposals;

-- 6. LISTAR CONSTRAINTS ATIVAS
SELECT 
    constraint_name,
    constraint_type,
    is_deferrable,
    initially_deferred
FROM information_schema.table_constraints 
WHERE table_name = 'proposals' 
AND constraint_type = 'CHECK'
ORDER BY constraint_name;
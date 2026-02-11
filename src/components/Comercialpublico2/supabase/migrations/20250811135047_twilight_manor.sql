/*
  # Migração: Consolidar colocacao_atual em posicao_atual

  1. Migração de dados
    - Copiar dados de `colocacao_atual` para `posicao_atual` quando necessário
    - Garantir que não há perda de dados

  2. Limpeza
    - Remover coluna `colocacao_atual` se existir
    - Manter apenas `posicao_atual` como campo oficial

  3. Segurança
    - Operação idempotente (pode ser executada múltiplas vezes)
    - Preserva dados existentes em `posicao_atual`
*/

-- Migrar dados da coluna antiga para nova (se existir)
DO $$
BEGIN
  -- Verificar se coluna colocacao_atual existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'colocacao_atual'
  ) THEN
    -- Migrar dados onde posicao_atual está vazio mas colocacao_atual tem valor
    UPDATE public.proposals
    SET posicao_atual = COALESCE(posicao_atual, colocacao_atual)
    WHERE colocacao_atual IS NOT NULL
      AND (posicao_atual IS NULL OR posicao_atual = '');
    
    -- Remover coluna antiga
    ALTER TABLE public.proposals DROP COLUMN colocacao_atual;
    
    RAISE NOTICE 'Migração concluída: colocacao_atual → posicao_atual';
  ELSE
    RAISE NOTICE 'Coluna colocacao_atual não existe - migração não necessária';
  END IF;
END $$;
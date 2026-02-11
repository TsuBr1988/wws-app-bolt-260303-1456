/*
  # Adicionar suporte a departamentos

  1. Modificações nas Tabelas
    - Adicionar coluna `department` nas tabelas principais
    - Atualizar índices para performance
    
  2. Dados de Teste
    - Inserir departamentos padrão
    
  3. Segurança
    - Manter políticas RLS existentes
*/

-- Adicionar coluna department na tabela proposals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'department'
  ) THEN
    ALTER TABLE proposals ADD COLUMN department text DEFAULT 'Comercial Público';
  END IF;
END $$;

-- Adicionar coluna department na tabela contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'department'
  ) THEN
    ALTER TABLE contracts ADD COLUMN department text DEFAULT 'Comercial Público';
  END IF;
END $$;

-- Adicionar coluna department na tabela challenges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenges' AND column_name = 'department'
  ) THEN
    ALTER TABLE challenges ADD COLUMN department text DEFAULT 'Comercial Público';
  END IF;
END $$;

-- Adicionar coluna department na tabela weekly_performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_performance' AND column_name = 'department'
  ) THEN
    ALTER TABLE weekly_performance ADD COLUMN department text DEFAULT 'Comercial Público';
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_proposals_department ON proposals (department);
CREATE INDEX IF NOT EXISTS idx_contracts_department ON contracts (department);
CREATE INDEX IF NOT EXISTS idx_challenges_department ON challenges (department);
CREATE INDEX IF NOT EXISTS idx_weekly_performance_department ON weekly_performance (department);

-- Atualizar registros existentes para ter departamento padrão
UPDATE proposals SET department = 'Comercial Público' WHERE department IS NULL;
UPDATE contracts SET department = 'Comercial Público' WHERE department IS NULL;
UPDATE challenges SET department = 'Comercial Público' WHERE department IS NULL;
UPDATE weekly_performance SET department = 'Comercial Público' WHERE department IS NULL;

-- Adicionar constraints NOT NULL após popular os dados
ALTER TABLE proposals ALTER COLUMN department SET NOT NULL;
ALTER TABLE contracts ALTER COLUMN department SET NOT NULL;
ALTER TABLE challenges ALTER COLUMN department SET NOT NULL;
ALTER TABLE weekly_performance ALTER COLUMN department SET NOT NULL;
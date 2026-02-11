/*
  # Adicionar suporte a departamento na tabela monthly_goals

  1. Alterações na Tabela
    - Adicionar coluna `department` na tabela `monthly_goals`
    - Atualizar constraint unique para incluir department
    - Migrar dados existentes para "Comercial Público"

  2. Segurança
    - Manter políticas RLS existentes
    - Adicionar índice para performance

  3. Dados
    - Preservar dados existentes
    - Definir departamento padrão
*/

-- Adicionar coluna department na tabela monthly_goals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_goals' AND column_name = 'department'
  ) THEN
    ALTER TABLE monthly_goals ADD COLUMN department text DEFAULT 'Comercial Público' NOT NULL;
  END IF;
END $$;

-- Atualizar dados existentes para usar "Comercial Público" como departamento padrão
UPDATE monthly_goals 
SET department = 'Comercial Público' 
WHERE department IS NULL OR department = 'Comercial Público';

-- Remover constraint unique antiga se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'monthly_goals' AND constraint_name = 'monthly_goals_year_month_key'
  ) THEN
    ALTER TABLE monthly_goals DROP CONSTRAINT monthly_goals_year_month_key;
  END IF;
END $$;

-- Adicionar nova constraint unique incluindo department
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'monthly_goals' AND constraint_name = 'monthly_goals_year_month_department_key'
  ) THEN
    ALTER TABLE monthly_goals ADD CONSTRAINT monthly_goals_year_month_department_key UNIQUE (year, month, department);
  END IF;
END $$;

-- Adicionar índice para performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'monthly_goals' AND indexname = 'idx_monthly_goals_department'
  ) THEN
    CREATE INDEX idx_monthly_goals_department ON monthly_goals (department);
  END IF;
END $$;

-- Atualizar índice year_month para incluir department
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'monthly_goals' AND indexname = 'idx_monthly_goals_year_month'
  ) THEN
    DROP INDEX idx_monthly_goals_year_month;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'monthly_goals' AND indexname = 'idx_monthly_goals_year_month_dept'
  ) THEN
    CREATE INDEX idx_monthly_goals_year_month_dept ON monthly_goals (year, month, department);
  END IF;
END $$;
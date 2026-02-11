/*
  # Adicionar campo empresa na tabela proposals

  1. Mudanças na Tabela
    - Adicionar coluna `empresa` na tabela `proposals`
    - Tipo: enum com valores 'WWS' e 'Worldwide'
    - Valor padrão: 'WWS'

  2. Segurança
    - Campo acessível pelas políticas RLS existentes
*/

-- Criar enum para empresa se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'empresa_type') THEN
    CREATE TYPE empresa_type AS ENUM ('WWS', 'Worldwide');
  END IF;
END $$;

-- Adicionar coluna empresa na tabela proposals se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'empresa'
  ) THEN
    ALTER TABLE proposals ADD COLUMN empresa empresa_type DEFAULT 'WWS'::empresa_type;
  END IF;
END $$;

-- Criar índice para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_proposals_empresa ON proposals (empresa);
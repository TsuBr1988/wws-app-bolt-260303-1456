/*
  # Adicionar colunas tipo e cidade à tabela clients

  1. Changes
    - Adiciona coluna `tipo` (Público ou Privado) à tabela `clients`
    - Adiciona coluna `cidade` (texto livre) à tabela `clients`
    - Renomeia coluna `Company` para `company` (padronização)

  2. Notas
    - A coluna `tipo` tem valores padrão 'Público' ou 'Privado'
    - A coluna `cidade` permite texto livre
    - A coluna `company` já existe mas será padronizada para minúscula
*/

-- Renomear coluna Company para company (padronização)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'Company'
  ) THEN
    ALTER TABLE clients RENAME COLUMN "Company" TO company;
  END IF;
END $$;

-- Adicionar coluna tipo se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE clients ADD COLUMN tipo text CHECK (tipo IN ('Público', 'Privado'));
  END IF;
END $$;

-- Adicionar coluna cidade se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'cidade'
  ) THEN
    ALTER TABLE clients ADD COLUMN cidade text;
  END IF;
END $$;
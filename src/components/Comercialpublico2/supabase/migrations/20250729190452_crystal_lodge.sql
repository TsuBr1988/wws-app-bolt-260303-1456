/*
  # Adicionar campos de numeração aos contratos

  1. Alterações na Tabela
    - Adicionar coluna `numero_pregao` (text, opcional)
    - Adicionar coluna `numero_contrato` (text, opcional)

  2. Índices
    - Criar índice para `numero_pregao` para facilitar buscas
    - Criar índice para `numero_contrato` para facilitar buscas

  3. Observações
    - Campos não obrigatórios para compatibilidade com contratos existentes
    - Permite pesquisa e organização por números oficiais
*/

-- Adicionar coluna numero_pregao
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'numero_pregao'
  ) THEN
    ALTER TABLE contracts ADD COLUMN numero_pregao text;
  END IF;
END $$;

-- Adicionar coluna numero_contrato
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'numero_contrato'
  ) THEN
    ALTER TABLE contracts ADD COLUMN numero_contrato text;
  END IF;
END $$;

-- Criar índices para facilitar buscas
CREATE INDEX IF NOT EXISTS idx_contracts_numero_pregao ON contracts(numero_pregao);
CREATE INDEX IF NOT EXISTS idx_contracts_numero_contrato ON contracts(numero_contrato);
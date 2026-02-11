/*
  # Tabela de Cálculos de Orçamentos

  1. Nova Tabela
    - `budget_calculations` (resultados dos cálculos)
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key) - Referência ao orçamento
      - `function_data` (jsonb) - Dados completos dos cálculos por função
      - `total_bdi` (numeric) - Taxa BDI calculada
      - `total_contract` (numeric) - Valor total do contrato
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização

  2. Segurança
    - Habilitar RLS na tabela
    - Política permissiva para acesso público (preparado para autenticação futura)

  3. Notas
    - Cada orçamento tem apenas um registro de cálculo (relacionamento 1:1)
    - Quando regerar a planilha, o registro é atualizado (UPSERT)
    - Os dados são salvos automaticamente ao clicar em "GERAR PLANILHA COMPLETA"
*/

-- Tabela de cálculos de orçamentos
CREATE TABLE IF NOT EXISTS budget_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL UNIQUE REFERENCES budgets(id) ON DELETE CASCADE,
  function_data jsonb NOT NULL,
  total_bdi numeric(10,4) NOT NULL,
  total_contract numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE budget_calculations ENABLE ROW LEVEL SECURITY;

-- Política permissiva para todos (enquanto não há autenticação)
CREATE POLICY "Allow all operations on budget_calculations"
  ON budget_calculations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_budget_calculations_budget_id ON budget_calculations(budget_id);

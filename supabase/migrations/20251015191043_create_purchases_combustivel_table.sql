/*
  # Criar tabela de Combustível de Compras

  1. Nova Tabela
    - `purchases_combustivel`
      - `id` (uuid, primary key)
      - `company` (text) - WWS ou Worldwide
      - `department` (text) - Nome do departamento
      - `budget_2025` (numeric) - Valor orçado total para 2025
      - `month_ym` (character(7), formato YYYY-MM)
      - `amount_spent` (numeric) - Valor gasto em R$ no mês
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `purchases_combustivel`
    - Adicionar políticas para usuários autenticados poderem ler, inserir, atualizar e deletar

  3. Validações
    - Validar formato do mês (YYYY-MM)
    - Validar valores não negativos
    - Validar empresa (WWS ou Worldwide)
    - Índice único por (company, department, month_ym)

  4. Notas Importantes
    - Cada linha representa um departamento em um mês específico
    - budget_2025 é o valor orçado total anual para aquele departamento
    - amount_spent é o valor efetivamente gasto no mês
    - O departamento é um campo de texto livre, não vinculado a outra tabela
*/

CREATE TABLE IF NOT EXISTS purchases_combustivel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL CHECK (company IN ('WWS', 'Worldwide')),
  department text NOT NULL,
  budget_2025 numeric(15, 2) NOT NULL DEFAULT 0 CHECK (budget_2025 >= 0),
  month_ym character(7) NOT NULL CHECK (month_ym ~ '^[0-9]{4}-[0-9]{2}$'),
  amount_spent numeric(15, 2) NOT NULL DEFAULT 0 CHECK (amount_spent >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT purchases_combustivel_unique_key UNIQUE (company, department, month_ym)
);

ALTER TABLE purchases_combustivel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select purchases_combustivel"
  ON purchases_combustivel
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert purchases_combustivel"
  ON purchases_combustivel
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update purchases_combustivel"
  ON purchases_combustivel
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete purchases_combustivel"
  ON purchases_combustivel
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_purchases_combustivel_month 
  ON purchases_combustivel(month_ym);

CREATE INDEX IF NOT EXISTS idx_purchases_combustivel_company 
  ON purchases_combustivel(company);

CREATE INDEX IF NOT EXISTS idx_purchases_combustivel_department 
  ON purchases_combustivel(department);

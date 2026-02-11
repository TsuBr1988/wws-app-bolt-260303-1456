/*
  # Criar tabela de EPIs de Compras

  1. Nova Tabela
    - `purchases_epis`
      - `id` (uuid, primary key)
      - `company` (text) - WWS ou Worldwide
      - `contract_name` (text) - Nome do contrato/cliente
      - `budget_2025` (numeric) - Valor orçado total para 2025
      - `month_ym` (character(7), formato YYYY-MM)
      - `amount_spent` (numeric) - Valor gasto em R$ no mês
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `purchases_epis`
    - Adicionar políticas para usuários autenticados poderem ler, inserir, atualizar e deletar

  3. Validações
    - Validar formato do mês (YYYY-MM)
    - Validar valores não negativos
    - Validar empresa (WWS ou Worldwide)
    - Índice único por (company, contract_name, month_ym)

  4. Notas Importantes
    - Cada linha representa um contrato em um mês específico
    - budget_2025 é o valor orçado total anual para aquele contrato
    - amount_spent é o valor efetivamente gasto no mês
    - Os contratos devem vir da tabela de clientes configurada
*/

CREATE TABLE IF NOT EXISTS purchases_epis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL CHECK (company IN ('WWS', 'Worldwide')),
  contract_name text NOT NULL,
  budget_2025 numeric(15, 2) NOT NULL DEFAULT 0 CHECK (budget_2025 >= 0),
  month_ym character(7) NOT NULL CHECK (month_ym ~ '^[0-9]{4}-[0-9]{2}$'),
  amount_spent numeric(15, 2) NOT NULL DEFAULT 0 CHECK (amount_spent >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT purchases_epis_unique_key UNIQUE (company, contract_name, month_ym)
);

ALTER TABLE purchases_epis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select purchases_epis"
  ON purchases_epis
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert purchases_epis"
  ON purchases_epis
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update purchases_epis"
  ON purchases_epis
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete purchases_epis"
  ON purchases_epis
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_purchases_epis_month 
  ON purchases_epis(month_ym);

CREATE INDEX IF NOT EXISTS idx_purchases_epis_company 
  ON purchases_epis(company);

CREATE INDEX IF NOT EXISTS idx_purchases_epis_contract 
  ON purchases_epis(contract_name);

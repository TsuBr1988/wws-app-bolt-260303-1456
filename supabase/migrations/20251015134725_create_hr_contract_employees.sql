/*
  # Criar tabela de funcionários de contrato vs efetivos

  1. Nova Tabela
    - `hr_contract_employees`
      - `id` (uuid, primary key)
      - `company` (text) - EES ou Worldwide
      - `contract_name` (text) - Nome do contrato
      - `contract_qty` (integer) - Quantidade de pessoas no contrato (orçadas)
      - `month_ym` (character(7), formato YYYY-MM)
      - `fixos` (integer) - Funcionários fixos
      - `ferias_concedidas` (integer) - Funcionários em férias
      - `feiristas` (integer) - Feiristas
      - `afastados` (integer) - Funcionários afastados
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `hr_contract_employees`
    - Adicionar políticas para usuários autenticados

  3. Validações
    - Validar formato do mês (YYYY-MM)
    - Validar valores não negativos
    - Validar empresa (EES ou Worldwide)
    - Índice único por (company, contract_name, month_ym)

  4. Notas Importantes
    - O valor de funcionários efetivos é calculado como: fixos + ferias_concedidas + feiristas + afastados
    - Cada linha representa um contrato em um mês específico
*/

CREATE TABLE IF NOT EXISTS hr_contract_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL CHECK (company IN ('EES', 'Worldwide')),
  contract_name text NOT NULL,
  contract_qty integer NOT NULL DEFAULT 0 CHECK (contract_qty >= 0),
  month_ym character(7) NOT NULL CHECK (month_ym ~ '^[0-9]{4}-[0-9]{2}$'),
  fixos integer NOT NULL DEFAULT 0 CHECK (fixos >= 0),
  ferias_concedidas integer NOT NULL DEFAULT 0 CHECK (ferias_concedidas >= 0),
  feiristas integer NOT NULL DEFAULT 0 CHECK (feiristas >= 0),
  afastados integer NOT NULL DEFAULT 0 CHECK (afastados >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT hr_contract_employees_unique_key UNIQUE (company, contract_name, month_ym)
);

-- Enable RLS
ALTER TABLE hr_contract_employees ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated can select hr_contract_employees"
  ON hr_contract_employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert hr_contract_employees"
  ON hr_contract_employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update hr_contract_employees"
  ON hr_contract_employees
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete hr_contract_employees"
  ON hr_contract_employees
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hr_contract_employees_month 
  ON hr_contract_employees(month_ym);

CREATE INDEX IF NOT EXISTS idx_hr_contract_employees_company 
  ON hr_contract_employees(company);

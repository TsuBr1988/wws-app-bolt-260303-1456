/*
  # Criar tabela de rescisões de RH

  1. Nova Tabela
    - `hr_severance`
      - `id` (uuid, primary key)
      - `company` (text) - EES ou Worldwide
      - `contract_name` (text) - Nome do contrato
      - `month_ym` (character(7), formato YYYY-MM)
      - `severance_amount` (numeric) - Valor em R$ das rescisões
      - `severance_qty` (integer) - Quantidade de rescisões
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `hr_severance`
    - Adicionar políticas para usuários autenticados poderem ler, inserir, atualizar e deletar

  3. Validações
    - Validar formato do mês (YYYY-MM)
    - Validar valores não negativos
    - Validar empresa (EES ou Worldwide)
    - Índice único por (company, contract_name, month_ym)

  4. Notas Importantes
    - Cada linha representa um contrato em um mês específico
    - severance_amount armazena o valor total de rescisões em reais
    - severance_qty armazena a quantidade de rescisões
*/

CREATE TABLE IF NOT EXISTS hr_severance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL CHECK (company IN ('EES', 'Worldwide')),
  contract_name text NOT NULL,
  month_ym character(7) NOT NULL CHECK (month_ym ~ '^[0-9]{4}-[0-9]{2}$'),
  severance_amount numeric(15, 2) NOT NULL DEFAULT 0 CHECK (severance_amount >= 0),
  severance_qty integer NOT NULL DEFAULT 0 CHECK (severance_qty >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT hr_severance_unique_key UNIQUE (company, contract_name, month_ym)
);

-- Enable RLS
ALTER TABLE hr_severance ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated can select hr_severance"
  ON hr_severance
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert hr_severance"
  ON hr_severance
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update hr_severance"
  ON hr_severance
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete hr_severance"
  ON hr_severance
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_hr_severance_month 
  ON hr_severance(month_ym);

CREATE INDEX IF NOT EXISTS idx_hr_severance_company 
  ON hr_severance(company);

CREATE INDEX IF NOT EXISTS idx_hr_severance_contract 
  ON hr_severance(contract_name);

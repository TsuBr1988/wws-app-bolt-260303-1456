/*
  # Create Contracts and Contract Addendums Tables

  1. New Tables
    - `contracts`
      - `id` (uuid, primary key)
      - `client_name` (text, required) - Nome do cliente
      - `city` (text) - Cidade
      - `numero_pregao` (text) - Número do pregão
      - `numero_contrato` (text) - Número do contrato
      - `monthly_value` (numeric) - Valor mensal do contrato
      - `start_date` (date, required) - Data de início
      - `end_date` (date, required) - Data de término
      - `contract_object` (text, required) - Objeto do contrato
      - `is_active` (boolean) - Status ativo/inativo
      - `empresa` (text) - WWS ou Worldwide
      - `department` (text) - Departamento responsável
      - `margem_percentual` (numeric) - Margem percentual
      - `proposal_id` (uuid) - Referência para proposta
      - `reequilibrio_dissidio` (boolean) - Flag para reequilíbrio dissídio
      - `reequilibrio_ipca` (boolean) - Flag para reequilíbrio IPCA
      - `ultimo_lembrete_dissidio` (date) - Data do último lembrete de dissídio
      - `ultimo_lembrete_ipca` (date) - Data do último lembrete de IPCA
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contract_addendums`
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key) - Referência ao contrato
      - `start_date` (date, required) - Data de início do aditivo
      - `end_date` (date, required) - Data de término do aditivo
      - `effective_start_date` (date) - Data efetiva de início
      - `effective_end_date` (date) - Data efetiva de término
      - `monthly_value` (numeric) - Valor mensal do aditivo
      - `observations` (text) - Observações do aditivo
      - `is_punctual` (boolean) - Se é aditivo pontual (temporário)
      - `is_active` (boolean) - Status ativo/inativo
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read and write access
  
  3. Indexes
    - Indexes on frequently queried columns for performance
  
  4. Important Notes
    - Contracts support permanent, punctual, and informative addendums
    - Punctual addendums are temporary value changes
    - Informative addendums have monthly_value = 0 and observations starting with "[ADITIVO INFORMATIVO]"
    - System automatically calculates current values considering active addendums
    - Alerts for contracts ending in 90 days
    - Rebalancing reminders (Dissídio: annually on Jan 10, IPCA: 10 months after start)
*/

-- Create function for updating updated_at timestamp if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  city text DEFAULT '',
  numero_pregao text,
  numero_contrato text,
  monthly_value numeric(12,2) NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  contract_object text NOT NULL,
  is_active boolean DEFAULT true,
  empresa text DEFAULT 'WWS',
  department text NOT NULL DEFAULT 'Comercial Publico',
  margem_percentual numeric DEFAULT 10.0,
  proposal_id uuid,
  reequilibrio_dissidio boolean DEFAULT false,
  reequilibrio_ipca boolean DEFAULT false,
  ultimo_lembrete_dissidio date,
  ultimo_lembrete_ipca date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for contracts
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_name);
CREATE INDEX IF NOT EXISTS idx_contracts_city ON contracts(city);
CREATE INDEX IF NOT EXISTS idx_contracts_department ON contracts(department);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal_id ON contracts(proposal_id);

-- Create contract_addendums table
CREATE TABLE IF NOT EXISTS contract_addendums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  effective_start_date date,
  effective_end_date date,
  monthly_value numeric(12,2) NOT NULL DEFAULT 0,
  observations text DEFAULT '',
  is_punctual boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for contract_addendums
CREATE INDEX IF NOT EXISTS idx_addendums_contract_id ON contract_addendums(contract_id);
CREATE INDEX IF NOT EXISTS idx_addendums_end_date ON contract_addendums(end_date);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_addendums ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contracts
CREATE POLICY "Allow public read access to contracts"
  ON contracts FOR SELECT TO public USING (true);

CREATE POLICY "Allow public write access to contracts"
  ON contracts FOR ALL TO public WITH CHECK (true);

-- Create RLS policies for contract_addendums
CREATE POLICY "Allow public read access to contract_addendums"
  ON contract_addendums FOR SELECT TO public USING (true);

CREATE POLICY "Allow public write access to contract_addendums"
  ON contract_addendums FOR ALL TO public WITH CHECK (true);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contract_addendums_updated_at ON contract_addendums;
CREATE TRIGGER update_contract_addendums_updated_at
  BEFORE UPDATE ON contract_addendums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
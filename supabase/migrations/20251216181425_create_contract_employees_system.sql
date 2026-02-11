/*
  # Sistema de Colaboradores por Contrato
  
  1. Nova Tabela: `contract_employees`
    - `id` (uuid, PK)
    - `contract_id` (uuid, FK para contracts)
    - `position` (text) - Função do colaborador
    - `created_at` (timestamp)
  
  2. Nova Tabela: `contract_employee_quantities`
    - `id` (uuid, PK)
    - `contract_employee_id` (uuid, FK para contract_employees)
    - `addendum_number` (integer) - 0 para base, 1+ para aditivos
    - `quantity` (integer) - Quantidade de colaboradores
    - `created_at` (timestamp)
  
  3. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para authenticated users
*/

-- Create contract_employees table
CREATE TABLE IF NOT EXISTS contract_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  position text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create contract_employee_quantities table
CREATE TABLE IF NOT EXISTS contract_employee_quantities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_employee_id uuid NOT NULL REFERENCES contract_employees(id) ON DELETE CASCADE,
  addendum_number integer NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contract_employee_id, addendum_number)
);

-- Enable RLS
ALTER TABLE contract_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_employee_quantities ENABLE ROW LEVEL SECURITY;

-- Policies for contract_employees
CREATE POLICY "Users can view contract employees"
  ON contract_employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert contract employees"
  ON contract_employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update contract employees"
  ON contract_employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete contract employees"
  ON contract_employees FOR DELETE
  TO authenticated
  USING (true);

-- Policies for contract_employee_quantities
CREATE POLICY "Users can view employee quantities"
  ON contract_employee_quantities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert employee quantities"
  ON contract_employee_quantities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update employee quantities"
  ON contract_employee_quantities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete employee quantities"
  ON contract_employee_quantities FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contract_employees_contract_id ON contract_employees(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_employee_quantities_employee_id ON contract_employee_quantities(contract_employee_id);
CREATE INDEX IF NOT EXISTS idx_contract_employee_quantities_addendum ON contract_employee_quantities(addendum_number);
/*
  # Corrigir Políticas RLS de Colaboradores

  1. Ajustes
    - Remover políticas antigas que usavam `authenticated`
    - Criar novas políticas usando `public` para compatibilidade com auth customizada
  
  2. Segurança
    - Manter RLS habilitado
    - Permitir acesso público (sistema usa auth customizada)
*/

-- Drop existing policies for contract_employees
DROP POLICY IF EXISTS "Users can view contract employees" ON contract_employees;
DROP POLICY IF EXISTS "Users can insert contract employees" ON contract_employees;
DROP POLICY IF EXISTS "Users can update contract employees" ON contract_employees;
DROP POLICY IF EXISTS "Users can delete contract employees" ON contract_employees;

-- Drop existing policies for contract_employee_quantities
DROP POLICY IF EXISTS "Users can view employee quantities" ON contract_employee_quantities;
DROP POLICY IF EXISTS "Users can insert employee quantities" ON contract_employee_quantities;
DROP POLICY IF EXISTS "Users can update employee quantities" ON contract_employee_quantities;
DROP POLICY IF EXISTS "Users can delete employee quantities" ON contract_employee_quantities;

-- Create new policies for contract_employees using public
CREATE POLICY "Allow public read access to contract_employees"
  ON contract_employees FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to contract_employees"
  ON contract_employees FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to contract_employees"
  ON contract_employees FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to contract_employees"
  ON contract_employees FOR DELETE
  TO public
  USING (true);

-- Create new policies for contract_employee_quantities using public
CREATE POLICY "Allow public read access to contract_employee_quantities"
  ON contract_employee_quantities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to contract_employee_quantities"
  ON contract_employee_quantities FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to contract_employee_quantities"
  ON contract_employee_quantities FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to contract_employee_quantities"
  ON contract_employee_quantities FOR DELETE
  TO public
  USING (true);
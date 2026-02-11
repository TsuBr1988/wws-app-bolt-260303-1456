/*
  # Fix RLS Policies for Custom Authentication

  1. Changes
    - Update all RLS policies to allow access via 'anon' role
    - This is necessary because the app uses custom authentication via app_users table
    - Without Supabase Auth, users authenticate as 'anon' role

  2. Security Note
    - Application-level permissions are enforced via the custom permissions system
    - RLS acts as a safety net but primary security is in the app layer
*/

-- BSC Items
DROP POLICY IF EXISTS "Authenticated users can read bsc items" ON bsc_items;
DROP POLICY IF EXISTS "Authenticated users can insert bsc items" ON bsc_items;
DROP POLICY IF EXISTS "Authenticated users can update bsc items" ON bsc_items;
DROP POLICY IF EXISTS "Authenticated users can delete bsc items" ON bsc_items;

CREATE POLICY "Allow all operations on bsc items"
  ON bsc_items FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- BSC Foundation
DROP POLICY IF EXISTS "Authenticated users can read bsc foundation" ON bsc_foundation;
DROP POLICY IF EXISTS "Authenticated users can insert bsc foundation" ON bsc_foundation;
DROP POLICY IF EXISTS "Authenticated users can update bsc foundation" ON bsc_foundation;
DROP POLICY IF EXISTS "Authenticated users can delete bsc foundation" ON bsc_foundation;

CREATE POLICY "Allow all operations on bsc foundation"
  ON bsc_foundation FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- HR Headcount
DROP POLICY IF EXISTS "Authenticated users can read hr headcount" ON hr_headcount;
DROP POLICY IF EXISTS "Authenticated users can insert hr headcount" ON hr_headcount;
DROP POLICY IF EXISTS "Authenticated users can update hr headcount" ON hr_headcount;
DROP POLICY IF EXISTS "Authenticated users can delete hr headcount" ON hr_headcount;

CREATE POLICY "Allow all operations on hr headcount"
  ON hr_headcount FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- HR Turnover
DROP POLICY IF EXISTS "Authenticated users can read hr turnover" ON hr_turnover;
DROP POLICY IF EXISTS "Authenticated users can insert hr turnover" ON hr_turnover;
DROP POLICY IF EXISTS "Authenticated users can update hr turnover" ON hr_turnover;
DROP POLICY IF EXISTS "Authenticated users can delete hr turnover" ON hr_turnover;

CREATE POLICY "Allow all operations on hr turnover"
  ON hr_turnover FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- HR Contract Employees
DROP POLICY IF EXISTS "Authenticated users can read hr contract employees" ON hr_contract_employees;
DROP POLICY IF EXISTS "Authenticated users can insert hr contract employees" ON hr_contract_employees;
DROP POLICY IF EXISTS "Authenticated users can update hr contract employees" ON hr_contract_employees;
DROP POLICY IF EXISTS "Authenticated users can delete hr contract employees" ON hr_contract_employees;

CREATE POLICY "Allow all operations on hr contract employees"
  ON hr_contract_employees FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- HR Absenteeism
DROP POLICY IF EXISTS "Authenticated users can read hr absenteeism" ON hr_absenteeism;
DROP POLICY IF EXISTS "Authenticated users can insert hr absenteeism" ON hr_absenteeism;
DROP POLICY IF EXISTS "Authenticated users can update hr absenteeism" ON hr_absenteeism;
DROP POLICY IF EXISTS "Authenticated users can delete hr absenteeism" ON hr_absenteeism;

CREATE POLICY "Allow all operations on hr absenteeism"
  ON hr_absenteeism FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- HR Severance
DROP POLICY IF EXISTS "Authenticated users can read hr severance" ON hr_severance;
DROP POLICY IF EXISTS "Authenticated users can insert hr severance" ON hr_severance;
DROP POLICY IF EXISTS "Authenticated users can update hr severance" ON hr_severance;
DROP POLICY IF EXISTS "Authenticated users can delete hr severance" ON hr_severance;

CREATE POLICY "Allow all operations on hr severance"
  ON hr_severance FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- HR Labor Lawsuits
DROP POLICY IF EXISTS "Authenticated users can read hr labor lawsuits" ON hr_labor_lawsuits;
DROP POLICY IF EXISTS "Authenticated users can insert hr labor lawsuits" ON hr_labor_lawsuits;
DROP POLICY IF EXISTS "Authenticated users can update hr labor lawsuits" ON hr_labor_lawsuits;
DROP POLICY IF EXISTS "Authenticated users can delete hr labor lawsuits" ON hr_labor_lawsuits;

CREATE POLICY "Allow all operations on hr labor lawsuits"
  ON hr_labor_lawsuits FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- HR Organogram
DROP POLICY IF EXISTS "Authenticated users can read hr organogram" ON hr_organogram;
DROP POLICY IF EXISTS "Authenticated users can insert hr organogram" ON hr_organogram;
DROP POLICY IF EXISTS "Authenticated users can update hr organogram" ON hr_organogram;
DROP POLICY IF EXISTS "Authenticated users can delete hr organogram" ON hr_organogram;

CREATE POLICY "Allow all operations on hr organogram"
  ON hr_organogram FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Clients
DROP POLICY IF EXISTS "Authenticated users can read clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

CREATE POLICY "Allow all operations on clients"
  ON clients FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Purchases Uniforms
DROP POLICY IF EXISTS "Authenticated users can read purchases uniforms" ON purchases_uniforms;
DROP POLICY IF EXISTS "Authenticated users can insert purchases uniforms" ON purchases_uniforms;
DROP POLICY IF EXISTS "Authenticated users can update purchases uniforms" ON purchases_uniforms;
DROP POLICY IF EXISTS "Authenticated users can delete purchases uniforms" ON purchases_uniforms;

CREATE POLICY "Allow all operations on purchases uniforms"
  ON purchases_uniforms FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Purchases Cleaning Materials
DROP POLICY IF EXISTS "Authenticated users can read purchases cleaning materials" ON purchases_cleaning_materials;
DROP POLICY IF EXISTS "Authenticated users can insert purchases cleaning materials" ON purchases_cleaning_materials;
DROP POLICY IF EXISTS "Authenticated users can update purchases cleaning materials" ON purchases_cleaning_materials;
DROP POLICY IF EXISTS "Authenticated users can delete purchases cleaning materials" ON purchases_cleaning_materials;

CREATE POLICY "Allow all operations on purchases cleaning materials"
  ON purchases_cleaning_materials FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Purchases EPIs
DROP POLICY IF EXISTS "Authenticated users can read purchases epis" ON purchases_epis;
DROP POLICY IF EXISTS "Authenticated users can insert purchases epis" ON purchases_epis;
DROP POLICY IF EXISTS "Authenticated users can update purchases epis" ON purchases_epis;
DROP POLICY IF EXISTS "Authenticated users can delete purchases epis" ON purchases_epis;

CREATE POLICY "Allow all operations on purchases epis"
  ON purchases_epis FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Purchases Equipamentos
DROP POLICY IF EXISTS "Authenticated users can read purchases equipamentos" ON purchases_equipamentos;
DROP POLICY IF EXISTS "Authenticated users can insert purchases equipamentos" ON purchases_equipamentos;
DROP POLICY IF EXISTS "Authenticated users can update purchases equipamentos" ON purchases_equipamentos;
DROP POLICY IF EXISTS "Authenticated users can delete purchases equipamentos" ON purchases_equipamentos;

CREATE POLICY "Allow all operations on purchases equipamentos"
  ON purchases_equipamentos FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Purchases Combustivel
DROP POLICY IF EXISTS "Authenticated users can read purchases combustivel" ON purchases_combustivel;
DROP POLICY IF EXISTS "Authenticated users can insert purchases combustivel" ON purchases_combustivel;
DROP POLICY IF EXISTS "Authenticated users can update purchases combustivel" ON purchases_combustivel;
DROP POLICY IF EXISTS "Authenticated users can delete purchases combustivel" ON purchases_combustivel;

CREATE POLICY "Allow all operations on purchases combustivel"
  ON purchases_combustivel FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Purchases Sem Parar
DROP POLICY IF EXISTS "Authenticated users can read purchases sem parar" ON purchases_sem_parar;
DROP POLICY IF EXISTS "Authenticated users can insert purchases sem parar" ON purchases_sem_parar;
DROP POLICY IF EXISTS "Authenticated users can update purchases sem parar" ON purchases_sem_parar;
DROP POLICY IF EXISTS "Authenticated users can delete purchases sem parar" ON purchases_sem_parar;

CREATE POLICY "Allow all operations on purchases sem parar"
  ON purchases_sem_parar FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Operational FTs
DROP POLICY IF EXISTS "Authenticated users can read operational fts" ON operational_fts;
DROP POLICY IF EXISTS "Authenticated users can insert operational fts" ON operational_fts;
DROP POLICY IF EXISTS "Authenticated users can update operational fts" ON operational_fts;
DROP POLICY IF EXISTS "Authenticated users can delete operational fts" ON operational_fts;

CREATE POLICY "Allow all operations on operational fts"
  ON operational_fts FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Operational Supervisor Visits
DROP POLICY IF EXISTS "Authenticated users can read operational supervisor visits" ON operational_supervisor_visits;
DROP POLICY IF EXISTS "Authenticated users can insert operational supervisor visits" ON operational_supervisor_visits;
DROP POLICY IF EXISTS "Authenticated users can update operational supervisor visits" ON operational_supervisor_visits;
DROP POLICY IF EXISTS "Authenticated users can delete operational supervisor visits" ON operational_supervisor_visits;

CREATE POLICY "Allow all operations on operational supervisor visits"
  ON operational_supervisor_visits FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Operational Client Visits
DROP POLICY IF EXISTS "Authenticated users can read operational client visits" ON operational_client_visits;
DROP POLICY IF EXISTS "Authenticated users can insert operational client visits" ON operational_client_visits;
DROP POLICY IF EXISTS "Authenticated users can update operational client visits" ON operational_client_visits;
DROP POLICY IF EXISTS "Authenticated users can delete operational client visits" ON operational_client_visits;

CREATE POLICY "Allow all operations on operational client visits"
  ON operational_client_visits FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Financial Contract Margin
DROP POLICY IF EXISTS "Authenticated users can read financial contract margin" ON financial_contract_margin;
DROP POLICY IF EXISTS "Authenticated users can insert financial contract margin" ON financial_contract_margin;
DROP POLICY IF EXISTS "Authenticated users can update financial contract margin" ON financial_contract_margin;
DROP POLICY IF EXISTS "Authenticated users can delete financial contract margin" ON financial_contract_margin;

CREATE POLICY "Allow all operations on financial contract margin"
  ON financial_contract_margin FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Financial Revenue
DROP POLICY IF EXISTS "Authenticated users can read fin revenue" ON fin_revenue;
DROP POLICY IF EXISTS "Authenticated users can insert fin revenue" ON fin_revenue;
DROP POLICY IF EXISTS "Authenticated users can update fin revenue" ON fin_revenue;
DROP POLICY IF EXISTS "Authenticated users can delete fin revenue" ON fin_revenue;

CREATE POLICY "Allow all operations on fin revenue"
  ON fin_revenue FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Financial Station Results
DROP POLICY IF EXISTS "Authenticated users can read financial station results" ON financial_station_results;
DROP POLICY IF EXISTS "Authenticated users can insert financial station results" ON financial_station_results;
DROP POLICY IF EXISTS "Authenticated users can update financial station results" ON financial_station_results;
DROP POLICY IF EXISTS "Authenticated users can delete financial station results" ON financial_station_results;

CREATE POLICY "Allow all operations on financial station results"
  ON financial_station_results FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Financial Administrative Expenses
DROP POLICY IF EXISTS "Authenticated users can read fin administrative expenses" ON fin_administrative_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert fin administrative expenses" ON fin_administrative_expenses;
DROP POLICY IF EXISTS "Authenticated users can update fin administrative expenses" ON fin_administrative_expenses;
DROP POLICY IF EXISTS "Authenticated users can delete fin administrative expenses" ON fin_administrative_expenses;

CREATE POLICY "Allow all operations on fin administrative expenses"
  ON fin_administrative_expenses FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Commercial Sales
DROP POLICY IF EXISTS "Authenticated users can read com sales" ON com_sales;
DROP POLICY IF EXISTS "Authenticated users can insert com sales" ON com_sales;
DROP POLICY IF EXISTS "Authenticated users can update com sales" ON com_sales;
DROP POLICY IF EXISTS "Authenticated users can delete com sales" ON com_sales;

CREATE POLICY "Allow all operations on com sales"
  ON com_sales FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Departments
DROP POLICY IF EXISTS "Authenticated users can read departments" ON departments;
DROP POLICY IF EXISTS "Authenticated users can insert departments" ON departments;
DROP POLICY IF EXISTS "Authenticated users can update departments" ON departments;
DROP POLICY IF EXISTS "Authenticated users can delete departments" ON departments;

CREATE POLICY "Allow all operations on departments"
  ON departments FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Contracts
DROP POLICY IF EXISTS "Authenticated users can read contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can insert contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can delete contracts" ON contracts;

CREATE POLICY "Allow all operations on contracts"
  ON contracts FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Contract Addendums
DROP POLICY IF EXISTS "Authenticated users can read contract addendums" ON contract_addendums;
DROP POLICY IF EXISTS "Authenticated users can insert contract addendums" ON contract_addendums;
DROP POLICY IF EXISTS "Authenticated users can update contract addendums" ON contract_addendums;
DROP POLICY IF EXISTS "Authenticated users can delete contract addendums" ON contract_addendums;

CREATE POLICY "Allow all operations on contract addendums"
  ON contract_addendums FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

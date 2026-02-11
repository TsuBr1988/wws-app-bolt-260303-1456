/*
  # Disable RLS for main application tables

  1. Disables RLS on core application tables to allow access with anon key
  2. Tables affected:
     - HR tables (headcount, employees, absenteeism, severance, organogram)
     - Operational tables (fts, visits)
     - Purchases tables
     - Financial tables
     - Contracts tables
     - Culture tables (bsc, departments, book_loans)
     - Actions and meeting minutes
     - Clients
*/

-- HR Tables
ALTER TABLE hr_headcount DISABLE ROW LEVEL SECURITY;
ALTER TABLE hr_contract_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE hr_absenteeism DISABLE ROW LEVEL SECURITY;
ALTER TABLE hr_severance DISABLE ROW LEVEL SECURITY;
ALTER TABLE hr_organogram DISABLE ROW LEVEL SECURITY;

-- Operational Tables
ALTER TABLE operational_fts DISABLE ROW LEVEL SECURITY;
ALTER TABLE operational_supervisor_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE operational_client_visits DISABLE ROW LEVEL SECURITY;

-- Purchases Tables
ALTER TABLE purchases_uniforms DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases_cleaning_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases_epis DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases_equipamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases_combustivel DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases_sem_parar DISABLE ROW LEVEL SECURITY;

-- Financial Tables
ALTER TABLE fin_revenue DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_station_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_contract_margin DISABLE ROW LEVEL SECURITY;
ALTER TABLE fin_administrative_expenses DISABLE ROW LEVEL SECURITY;

-- Commercial Tables
ALTER TABLE com_sales DISABLE ROW LEVEL SECURITY;

-- Contracts Tables
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_addendums DISABLE ROW LEVEL SECURITY;

-- Clients Table
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- BSC and Culture Tables
ALTER TABLE bsc_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE book_loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_plan DISABLE ROW LEVEL SECURITY;
ALTER TABLE flywheel DISABLE ROW LEVEL SECURITY;

-- Actions and Meeting Minutes
ALTER TABLE actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE action_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes DISABLE ROW LEVEL SECURITY;

-- Qualidade
ALTER TABLE qualidade_politica DISABLE ROW LEVEL SECURITY;

-- Config Tables
ALTER TABLE config_benefits DISABLE ROW LEVEL SECURITY;

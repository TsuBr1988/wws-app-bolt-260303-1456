/*
  # Simplify Individual Prospection Structure
  
  1. Changes
    - Drop the two-table structure (individual_prospection_dates and individual_prospection_metrics)
    - Create a single table with all metrics as columns
    - Each row represents one day for one employee
  
  2. New Table Structure
    - `individual_prospection`
      - `id` (uuid, primary key)
      - `employee_name` (text) - André, Andressa, ou Pedro
      - `date` (date) - Data do registro
      - `contatos_ativados` (numeric) - Para todos
      - `mql` (numeric) - Apenas Andressa e Pedro
      - `sql` (numeric) - Apenas André
      - `atividades_qtde` (numeric) - Para todos
      - `atividades_perc` (numeric) - Para todos
      - `reunioes` (numeric) - Para todos
      - `conexoes` (numeric) - Para todos
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on (employee_name, date)
  
  3. Security
    - RLS disabled (internal management tool without authentication)
*/

-- Drop old tables
DROP TABLE IF EXISTS individual_prospection_metrics CASCADE;
DROP TABLE IF EXISTS individual_prospection_dates CASCADE;

-- Create new simplified table
CREATE TABLE IF NOT EXISTS individual_prospection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL CHECK (employee_name IN ('André', 'Andressa', 'Pedro')),
  date date NOT NULL,
  contatos_ativados numeric DEFAULT 0,
  mql numeric DEFAULT 0,
  sql numeric DEFAULT 0,
  atividades_qtde numeric DEFAULT 0,
  atividades_perc numeric DEFAULT 0,
  reunioes numeric DEFAULT 0,
  conexoes numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (employee_name, date)
);

-- Disable RLS (no authentication in the app)
ALTER TABLE individual_prospection DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_individual_prospection_employee ON individual_prospection(employee_name);
CREATE INDEX IF NOT EXISTS idx_individual_prospection_date ON individual_prospection(date);
CREATE INDEX IF NOT EXISTS idx_individual_prospection_employee_date ON individual_prospection(employee_name, date);

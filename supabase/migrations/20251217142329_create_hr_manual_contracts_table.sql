/*
  # Create HR Manual Contracts Table

  1. New Tables
    - `hr_manual_contracts`
      - `id` (uuid, primary key)
      - `contract_name` (text) - Nome do contrato manual
      - `empresa` (text) - WWS ou Worldwide
      - `tipo` (text) - Publico ou Privado
      - `city` (text) - Cidade do contrato
      - `contract_qty` (integer) - Quantidade de funcionários contratados
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `hr_manual_contracts` table
    - Add policy for authenticated users to manage manual contracts

  3. Purpose
    This table stores manually added contracts that are not in the main contracts table,
    such as administrative contracts or terminated contracts with employees still on payroll.
*/

CREATE TABLE IF NOT EXISTS hr_manual_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name text NOT NULL,
  empresa text DEFAULT 'WWS',
  tipo text DEFAULT 'Publico',
  city text,
  contract_qty integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hr_manual_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read manual contracts"
  ON hr_manual_contracts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert manual contracts"
  ON hr_manual_contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update manual contracts"
  ON hr_manual_contracts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete manual contracts"
  ON hr_manual_contracts
  FOR DELETE
  TO authenticated
  USING (true);
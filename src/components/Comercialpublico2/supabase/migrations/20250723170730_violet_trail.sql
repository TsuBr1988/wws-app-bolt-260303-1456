/*
  # Create contracts management system

  1. New Tables
    - `contracts`
      - `id` (uuid, primary key)
      - `client_name` (text)
      - `monthly_value` (numeric)
      - `start_date` (date)
      - `end_date` (date)
      - `contract_object` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `contract_addendums`
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key)
      - `start_date` (date)
      - `end_date` (date)
      - `monthly_value` (numeric)
      - `observations` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (matching current system pattern)
*/

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  monthly_value numeric(12,2) NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  contract_object text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contract addendums table
CREATE TABLE IF NOT EXISTS contract_addendums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_value numeric(12,2) NOT NULL DEFAULT 0,
  observations text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_addendums ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_name);
CREATE INDEX IF NOT EXISTS idx_addendums_contract_id ON contract_addendums(contract_id);
CREATE INDEX IF NOT EXISTS idx_addendums_end_date ON contract_addendums(end_date);

-- Add policies for public access (matching current system pattern)
CREATE POLICY "Allow public read access to contracts"
  ON contracts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access to contracts"
  ON contracts
  FOR ALL
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to contract_addendums"
  ON contract_addendums
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access to contract_addendums"
  ON contract_addendums
  FOR ALL
  TO public
  WITH CHECK (true);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'contracts' 
    AND trigger_name = 'update_contracts_updated_at'
  ) THEN
    CREATE TRIGGER update_contracts_updated_at
      BEFORE UPDATE ON contracts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'contract_addendums' 
    AND trigger_name = 'update_contract_addendums_updated_at'
  ) THEN
    CREATE TRIGGER update_contract_addendums_updated_at
      BEFORE UPDATE ON contract_addendums
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
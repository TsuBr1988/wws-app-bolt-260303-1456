/*
  # Create orcamentos (budgets) table

  1. New Tables
    - `orcamentos`
      - `id` (uuid, primary key)
      - `numero` (text, unique) - Budget number (e.g., CP-202501-1234)
      - `cliente` (text) - Client name
      - `itens` (jsonb) - Budget items with functions, salaries, and costs
      - `valor_total` (numeric) - Total budget value
      - `data_criacao` (date) - Creation date
      - `data_validade` (date) - Expiration date
      - `status` (text) - Budget status (rascunho, enviado, aprovado, rejeitado, revisao)
      - `observacoes` (text, optional) - Additional observations
      - `criado_por` (text) - Creator name
      - `department` (text) - Department (Comercial Público or Petrobras)
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `orcamentos` table
    - Add policy for public read access
    - Add policy for public write access (following existing pattern)

  3. Indexes
    - Index on department for filtering
    - Index on status for filtering
    - Index on data_validade for expiration queries
    - Index on created_at for ordering
*/

-- Create orcamentos table
CREATE TABLE IF NOT EXISTS orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  cliente text NOT NULL,
  itens jsonb DEFAULT '[]'::jsonb,
  valor_total numeric(15,2) DEFAULT 0 NOT NULL,
  data_criacao date NOT NULL,
  data_validade date NOT NULL,
  status text DEFAULT 'rascunho' NOT NULL,
  observacoes text,
  criado_por text NOT NULL,
  department text DEFAULT 'Comercial Público' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (following existing pattern for public access)
CREATE POLICY "Allow public read access to orcamentos"
  ON orcamentos
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access to orcamentos"
  ON orcamentos
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_department ON orcamentos(department);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_validade ON orcamentos(data_validade);
CREATE INDEX IF NOT EXISTS idx_orcamentos_created_at ON orcamentos(created_at);
CREATE INDEX IF NOT EXISTS idx_orcamentos_numero ON orcamentos(numero);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_orcamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_orcamentos_updated_at();

-- Add constraint for valid status values
ALTER TABLE orcamentos ADD CONSTRAINT orcamentos_status_check 
  CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'rejeitado', 'revisao'));

-- Add constraint for valid dates (validade must be after criacao)
ALTER TABLE orcamentos ADD CONSTRAINT orcamentos_dates_check 
  CHECK (data_validade > data_criacao);
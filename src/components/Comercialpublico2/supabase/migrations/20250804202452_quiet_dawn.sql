/*
  # Create Tarefas (Tasks) System

  1. New Tables
    - `tarefas`
      - `id` (uuid, primary key)
      - `nome` (text, task name)
      - `descricao` (text, task description)
      - `status` (text, task status: 'A fazer', 'Fazendo', 'Feito')
      - `data_inclusao` (timestamp, creation date)
      - `data_prazo` (timestamp, deadline)
      - `criado_por` (text, created by)
      - `responsavel` (text, responsible person)
      - `department` (text, department filter)

  2. Security
    - Enable RLS on `tarefas` table
    - Add policies for public access (matching project pattern)

  3. Indexes
    - Add indexes for performance optimization
*/

-- Create tarefas table
CREATE TABLE IF NOT EXISTS tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  status text DEFAULT 'A fazer' CHECK (status IN ('A fazer', 'Fazendo', 'Feito')),
  data_inclusao timestamp with time zone DEFAULT now(),
  data_prazo timestamp with time zone NOT NULL,
  criado_por text NOT NULL,
  responsavel text NOT NULL,
  department text DEFAULT 'Comercial Público' NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- Create policies (following project pattern of public access)
CREATE POLICY "Allow public read access to tarefas"
  ON tarefas
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access to tarefas"
  ON tarefas
  FOR ALL
  TO public
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas USING btree (status);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON tarefas USING btree (responsavel);
CREATE INDEX IF NOT EXISTS idx_tarefas_department ON tarefas USING btree (department);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_prazo ON tarefas USING btree (data_prazo);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_tarefas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tarefas_updated_at
  BEFORE UPDATE ON tarefas
  FOR EACH ROW
  EXECUTE FUNCTION update_tarefas_updated_at();
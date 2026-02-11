/*
  # Criar Tabela de Funções/Cargos

  1. Nova Tabela: `employee_positions`
    - `id` (uuid, PK)
    - `name` (text, unique) - Nome da função/cargo
    - `created_at` (timestamp)
  
  2. Segurança
    - Enable RLS
    - Políticas públicas (compatível com auth customizada)
  
  3. Dados Iniciais
    - Funções comuns já cadastradas
*/

-- Create employee_positions table
CREATE TABLE IF NOT EXISTS employee_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employee_positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to employee_positions"
  ON employee_positions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to employee_positions"
  ON employee_positions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to employee_positions"
  ON employee_positions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to employee_positions"
  ON employee_positions FOR DELETE
  TO public
  USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_employee_positions_name ON employee_positions(name);

-- Insert common positions
INSERT INTO employee_positions (name) VALUES
  ('Vigilante desarmado 12x36 diurno'),
  ('Vigilante desarmado 12x36 noturno'),
  ('Supervisor'),
  ('Coordenador'),
  ('Gerente'),
  ('Auxiliar Administrativo'),
  ('Porteiro'),
  ('Controlador de Acesso')
ON CONFLICT (name) DO NOTHING;
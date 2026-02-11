/*
  # Tabela de Cidades e Taxas de ISSQN

  1. Nova Tabela
    - `cities` (cidades)
      - `id` (uuid, primary key)
      - `name` (text) - Nome da cidade
      - `iss_rate` (numeric) - Taxa de ISSQN (%)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Dados Iniciais
    - Inserir cidades padrão com suas taxas de ISSQN

  3. Segurança
    - Habilitar RLS na tabela
    - Políticas para permitir operações públicas
*/

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  iss_rate numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on cities"
  ON cities
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

INSERT INTO cities (name, iss_rate) VALUES
  ('AMERICANA', 3.0),
  ('ÁGUAS DE SANTA BÁRBARA', 2.0),
  ('CAMPINAS', 5.0),
  ('SÃO PAULO', 5.0),
  ('VOTORANTIM', 5.0)
ON CONFLICT (name) DO NOTHING;
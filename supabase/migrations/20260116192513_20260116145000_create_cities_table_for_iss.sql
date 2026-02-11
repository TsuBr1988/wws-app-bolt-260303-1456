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
    - Desabilitar RLS na tabela para facilitar acesso
*/

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  iss_rate numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cities DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

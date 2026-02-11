/*
  # Create BSC Foundation Table

  1. New Tables
    - `bsc_foundation`
      - `id` (uuid, primary key)
      - `field_name` (text, unique) - Nome do campo (Visão, Missão, Valores, etc)
      - `content` (text) - Conteúdo editável do campo
      - `order_position` (integer) - Ordem de exibição
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Initial Data
    - Insert default fields: Visão, Missão, Valores, Temas centrais, Resultados estratégicos

  3. Security
    - Enable RLS on `bsc_foundation` table
    - Add policies for authenticated users to read, insert, update, and delete
*/

CREATE TABLE IF NOT EXISTS bsc_foundation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text UNIQUE NOT NULL,
  content text DEFAULT '',
  order_position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bsc_foundation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bsc foundation"
  ON bsc_foundation
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bsc foundation"
  ON bsc_foundation
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bsc foundation"
  ON bsc_foundation
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bsc foundation"
  ON bsc_foundation
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_bsc_foundation_order ON bsc_foundation(order_position);

INSERT INTO bsc_foundation (field_name, content, order_position) VALUES
  ('Visão', '', 1),
  ('Missão', '', 2),
  ('Valores', '', 3),
  ('Temas centrais', '', 4),
  ('Resultados estratégicos', '', 5)
ON CONFLICT (field_name) DO NOTHING;
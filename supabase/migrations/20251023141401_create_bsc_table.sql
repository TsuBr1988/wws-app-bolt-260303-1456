/*
  # Create BSC (Balanced Scorecard) Table

  1. New Tables
    - `bsc_items`
      - `id` (uuid, primary key)
      - `title` (text) - Título do item
      - `description` (text, nullable) - Descrição/conteúdo do item
      - `parent_id` (uuid, nullable) - Referência ao item pai na hierarquia
      - `level` (integer) - Nível hierárquico (0=Topo, 1=Nível 1, etc)
      - `order_position` (integer) - Ordem de exibição entre itens do mesmo nível
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `bsc_items` table
    - Add policies for authenticated users to read, insert, update, and delete
*/

CREATE TABLE IF NOT EXISTS bsc_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  parent_id uuid REFERENCES bsc_items(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 0,
  order_position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bsc_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bsc items"
  ON bsc_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bsc items"
  ON bsc_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bsc items"
  ON bsc_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bsc items"
  ON bsc_items
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_bsc_items_parent_id ON bsc_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_bsc_items_level ON bsc_items(level);
CREATE INDEX IF NOT EXISTS idx_bsc_items_order ON bsc_items(order_position);
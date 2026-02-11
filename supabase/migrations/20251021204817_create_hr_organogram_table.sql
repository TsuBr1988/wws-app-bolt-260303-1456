/*
  # Create HR Organogram Table

  1. New Tables
    - `hr_organogram`
      - `id` (uuid, primary key)
      - `employee_name` (text) - Nome do funcionário/cargo
      - `position` (text) - Cargo/posição
      - `parent_id` (uuid, nullable) - Referência ao superior hierárquico
      - `level` (integer) - Nível hierárquico (0=CEO, 1=Diretoria, etc)
      - `department` (text, nullable) - Departamento
      - `email` (text, nullable) - Email do funcionário
      - `phone` (text, nullable) - Telefone
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `hr_organogram` table
    - Add policy for authenticated users to read all data
    - Add policy for authenticated users to insert data
    - Add policy for authenticated users to update data
    - Add policy for authenticated users to delete data
*/

CREATE TABLE IF NOT EXISTS hr_organogram (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  position text NOT NULL,
  parent_id uuid REFERENCES hr_organogram(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 0,
  department text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hr_organogram ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read organogram"
  ON hr_organogram
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert organogram"
  ON hr_organogram
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update organogram"
  ON hr_organogram
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete organogram"
  ON hr_organogram
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_hr_organogram_parent_id ON hr_organogram(parent_id);
CREATE INDEX IF NOT EXISTS idx_hr_organogram_level ON hr_organogram(level);
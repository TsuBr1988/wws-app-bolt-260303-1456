/*
  # Create Departments Table

  1. New Tables
    - `departments`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Nome do departamento
      - `parent_id` (uuid, nullable) - Referência ao departamento pai
      - `level` (integer) - Nível hierárquico (0=Diretoria, 1=Departamento, 2=Subdepartamento)
      - `description` (text, nullable) - Descrição do departamento
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Update hr_organogram to reference departments table

  3. Security
    - Enable RLS on `departments` table
    - Add policies for authenticated users to read, insert, update, and delete
*/

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  parent_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert departments"
  ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update departments"
  ON departments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete departments"
  ON departments
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_level ON departments(level);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hr_organogram' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE hr_organogram ADD COLUMN department_id uuid REFERENCES departments(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_hr_organogram_department_id ON hr_organogram(department_id);
  END IF;
END $$;
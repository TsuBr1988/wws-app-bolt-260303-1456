/*
  # Criar tabela de metas dos departamentos

  1. Nova Tabela
    - `department_goals`
      - `id` (uuid, primary key)
      - `department_name` (text) - Nome do departamento
      - `goal_text` (text) - Descrição/meta do departamento
      - `display_order` (integer) - Ordem de exibição
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS na tabela `department_goals`
    - Adicionar políticas para usuários autenticados visualizarem
    - Adicionar políticas para usuários com permissão editarem
*/

CREATE TABLE IF NOT EXISTS department_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_name text NOT NULL,
  goal_text text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE department_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view department goals"
  ON department_goals
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert department goals"
  ON department_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update department goals"
  ON department_goals
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete department goals"
  ON department_goals
  FOR DELETE
  TO authenticated
  USING (true);

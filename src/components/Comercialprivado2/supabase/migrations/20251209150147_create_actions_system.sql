/*
  # Create Actions System Tables

  1. New Tables
    - `actions`
      - `id` (uuid, primary key)
      - `descricao` (text) - Descrição da ação
      - `responsavel` (text) - Nome do responsável
      - `data_prazo` (date) - Data limite
      - `status` (text) - Valores: 'a_fazer', 'fazendo', 'feito'
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização

    - `meeting_minutes`
      - `id` (uuid, primary key)
      - `title` (text) - Título da reunião
      - `date` (date) - Data da reunião
      - `content` (text) - Conteúdo da ata
      - `participants` (text) - Lista de participantes
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização

    - `action_comments`
      - `id` (uuid, primary key)
      - `action_id` (uuid, FK) - Referência para actions
      - `author_name` (text) - Nome do autor
      - `comment_text` (text) - Texto do comentário
      - `created_at` (timestamptz) - Data de criação

  2. Security
    - Enable RLS on all tables
    - Add policies for public read/write access
*/

CREATE TABLE IF NOT EXISTS actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  responsavel text NOT NULL,
  data_prazo date NOT NULL,
  status text NOT NULL DEFAULT 'a_fazer' CHECK (status IN ('a_fazer', 'fazendo', 'feito')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  content text NOT NULL,
  participants text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS action_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_data_prazo ON actions(data_prazo);
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON actions(created_at);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_date ON meeting_minutes(date);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_created_at ON meeting_minutes(created_at);

CREATE INDEX IF NOT EXISTS idx_action_comments_action_id ON action_comments(action_id);
CREATE INDEX IF NOT EXISTS idx_action_comments_created_at ON action_comments(created_at);

DO $$
BEGIN
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;
EXCEPTION
  WHEN duplicate_function THEN NULL;
END $$;

DROP TRIGGER IF EXISTS update_actions_updated_at ON actions;
CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_minutes_updated_at ON meeting_minutes;
CREATE TRIGGER update_meeting_minutes_updated_at
  BEFORE UPDATE ON meeting_minutes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to actions"
  ON actions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to actions"
  ON actions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to actions"
  ON actions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to actions"
  ON actions
  FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to meeting_minutes"
  ON meeting_minutes
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to meeting_minutes"
  ON meeting_minutes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to meeting_minutes"
  ON meeting_minutes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to meeting_minutes"
  ON meeting_minutes
  FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to action_comments"
  ON action_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to action_comments"
  ON action_comments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to action_comments"
  ON action_comments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to action_comments"
  ON action_comments
  FOR DELETE
  USING (true);

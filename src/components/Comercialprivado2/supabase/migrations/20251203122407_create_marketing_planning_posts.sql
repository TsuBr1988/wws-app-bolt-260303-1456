/*
  # Create Marketing Planning Posts Table

  1. New Tables
    - `marketing_planning_posts`
      - `id` (uuid, primary key)
      - `name` (text) - Nome da postagem
      - `platforms` (text[]) - Array de plataformas (linkedin, instagram, facebook, blog)
      - `post_date` (date) - Data planejada para a postagem
      - `idea` (text) - Descrição/ideia da postagem
      - `created_at` (timestamptz) - Data de criação do registro
      - `updated_at` (timestamptz) - Data de atualização do registro
      - `created_by` (uuid) - Referência ao usuário que criou

  2. Security
    - Enable RLS on `marketing_planning_posts` table
    - Add policy for authenticated users to manage their posts
*/

CREATE TABLE IF NOT EXISTS marketing_planning_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  post_date date NOT NULL,
  idea text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE marketing_planning_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all marketing planning posts"
  ON marketing_planning_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create marketing planning posts"
  ON marketing_planning_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update marketing planning posts"
  ON marketing_planning_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete marketing planning posts"
  ON marketing_planning_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_marketing_planning_posts_date ON marketing_planning_posts(post_date);
CREATE INDEX IF NOT EXISTS idx_marketing_planning_posts_created_by ON marketing_planning_posts(created_by);

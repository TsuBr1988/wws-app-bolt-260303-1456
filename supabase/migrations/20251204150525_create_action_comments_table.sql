/*
  # Create Action Comments Table

  1. New Tables
    - `action_comments`
      - `id` (uuid, primary key) - ID único do comentário
      - `action_id` (uuid, required) - ID da ação relacionada
      - `author_name` (text, required) - Nome do autor do comentário
      - `comment_text` (text, required) - Texto do comentário
      - `created_at` (timestamptz) - Data de criação automática
  
  2. Security
    - Enable RLS on `action_comments` table
    - Add policies for public access to read and write comments
  
  3. Indexes
    - Index on action_id for efficient filtering
    - Index on created_at for ordering
  
  4. Foreign Keys
    - action_id references actions(id) with cascade delete
*/

-- Create action_comments table
CREATE TABLE IF NOT EXISTS action_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_action_comments_action_id ON action_comments(action_id);
CREATE INDEX IF NOT EXISTS idx_action_comments_created_at ON action_comments(created_at DESC);

-- Enable RLS
ALTER TABLE action_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to action_comments"
  ON action_comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on action_comments"
  ON action_comments FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on action_comments"
  ON action_comments FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on action_comments"
  ON action_comments FOR DELETE
  TO public
  USING (true);
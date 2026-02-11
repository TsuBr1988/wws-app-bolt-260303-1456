/*
  # Create Strategic Plan Table
  
  1. New Tables
    - `strategic_plan`
      - `id` (uuid, primary key)
      - `image1_url` (text) - URL da primeira imagem
      - `image2_url` (text) - URL da segunda imagem
      - `image3_url` (text) - URL da terceira imagem
      - `description` (text) - Texto descritivo
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on strategic_plan table
    - Add policies for public access (compatible with existing auth)
  
  3. Important Notes
    - Only one record should exist (singleton pattern)
    - Images stored as URLs (can be base64 data URLs or external URLs)
*/

-- Create strategic_plan table
CREATE TABLE IF NOT EXISTS strategic_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image1_url text,
  image2_url text,
  image3_url text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_strategic_plan_created_at ON strategic_plan(created_at);

-- Enable RLS
ALTER TABLE strategic_plan ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access
CREATE POLICY "Public can view strategic plan"
  ON strategic_plan FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert strategic plan"
  ON strategic_plan FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update strategic plan"
  ON strategic_plan FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete strategic plan"
  ON strategic_plan FOR DELETE
  TO public
  USING (true);

-- Authenticated user policies
CREATE POLICY "Authenticated users can view strategic plan"
  ON strategic_plan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert strategic plan"
  ON strategic_plan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update strategic plan"
  ON strategic_plan FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete strategic plan"
  ON strategic_plan FOR DELETE
  TO authenticated
  USING (true);

-- Insert initial empty record
INSERT INTO strategic_plan (id, image1_url, image2_url, image3_url, description)
VALUES (gen_random_uuid(), null, null, null, null)
ON CONFLICT DO NOTHING;

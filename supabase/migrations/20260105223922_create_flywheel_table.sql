/*
  # Create Flywheel table

  1. New Tables
    - `flywheel`
      - `id` (uuid, primary key)
      - `cover_image_url` (text) - URL da imagem de capa
      - `pdf_url` (text) - URL do PDF
      - `content` (text) - Texto descritivo
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
  2. Security
    - Enable RLS on `flywheel` table
    - Add policy for authenticated users to read flywheel
    - Add policy for authenticated users with edit permissions to modify
*/

CREATE TABLE IF NOT EXISTS flywheel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_image_url text,
  pdf_url text,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE flywheel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read flywheel"
  ON flywheel
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert flywheel"
  ON flywheel
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update flywheel"
  ON flywheel
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete flywheel"
  ON flywheel
  FOR DELETE
  TO authenticated
  USING (true);
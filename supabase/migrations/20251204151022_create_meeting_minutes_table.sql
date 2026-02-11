/*
  # Create Meeting Minutes (ATAs) Table

  1. New Tables
    - `meeting_minutes`
      - `id` (uuid, primary key) - ID único da ata
      - `title` (text, required) - Título da reunião
      - `date` (date, required) - Data da reunião
      - `content` (text, required) - Conteúdo da ata
      - `participants` (text) - Participantes da reunião
      - `created_at` (timestamptz) - Data de criação automática
      - `updated_at` (timestamptz) - Data de última atualização
  
  2. Security
    - Enable RLS on `meeting_minutes` table
    - Add policies for public access to read and write meeting minutes
  
  3. Indexes
    - Index on date for efficient sorting
    - Index on created_at for ordering
*/

-- Create meeting_minutes table
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  content text NOT NULL,
  participants text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_date ON meeting_minutes(date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_created_at ON meeting_minutes(created_at DESC);

-- Enable RLS
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to meeting_minutes"
  ON meeting_minutes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on meeting_minutes"
  ON meeting_minutes FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on meeting_minutes"
  ON meeting_minutes FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on meeting_minutes"
  ON meeting_minutes FOR DELETE
  TO public
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meeting_minutes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_meeting_minutes_updated_at
  BEFORE UPDATE ON meeting_minutes
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_minutes_updated_at();
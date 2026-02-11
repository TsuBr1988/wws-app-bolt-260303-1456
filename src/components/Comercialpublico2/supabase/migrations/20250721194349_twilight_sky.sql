/*
  # Create monthly goals table

  1. New Tables
    - `monthly_goals`
      - `id` (uuid, primary key)
      - `year` (integer)
      - `month` (integer, 1-12)
      - `target_value` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `monthly_goals` table
    - Add policies for public access (no auth required)
    
  3. Constraints
    - Unique constraint on year+month combination
    - Check constraint to ensure month is between 1-12
*/

CREATE TABLE IF NOT EXISTS monthly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  target_value numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(year, month)
);

-- Enable RLS
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;

-- Allow public access (no authentication required)
CREATE POLICY "Allow public read access to monthly_goals"
  ON monthly_goals
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access to monthly_goals"
  ON monthly_goals
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monthly_goals_updated_at
  BEFORE UPDATE ON monthly_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_monthly_goals_year_month ON monthly_goals(year, month);

-- Insert default goals for 2025 (300k per month)
INSERT INTO monthly_goals (year, month, target_value) VALUES
  (2025, 1, 300000),
  (2025, 2, 300000),
  (2025, 3, 300000),
  (2025, 4, 300000),
  (2025, 5, 300000),
  (2025, 6, 300000),
  (2025, 7, 300000),
  (2025, 8, 300000),
  (2025, 9, 300000),
  (2025, 10, 300000),
  (2025, 11, 300000),
  (2025, 12, 300000)
ON CONFLICT (year, month) DO NOTHING;
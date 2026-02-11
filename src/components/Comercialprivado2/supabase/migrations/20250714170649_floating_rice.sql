/*
  # Create monthly highlights table

  1. New Tables
    - `monthly_highlights`
      - `id` (uuid, primary key)
      - `year` (integer)
      - `month` (integer, 1-12)
      - `employee_id` (uuid, foreign key to employees)
      - `total_points` (integer)
      - `tasks_points` (integer)
      - `meetings_points` (integer)
      - `proposals_points` (integer)
      - `closed_deals_points` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `monthly_highlights` table
    - Add policy for authenticated users to read and manage highlights

  3. Constraints
    - Unique constraint on (year, month) to prevent duplicates
    - Foreign key constraint to employees table
*/

CREATE TABLE IF NOT EXISTS monthly_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  tasks_points integer DEFAULT 0,
  meetings_points integer DEFAULT 0,
  proposals_points integer DEFAULT 0,
  closed_deals_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(year, month)
);

ALTER TABLE monthly_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read monthly highlights"
  ON monthly_highlights
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage monthly highlights"
  ON monthly_highlights
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monthly_highlights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monthly_highlights_updated_at
  BEFORE UPDATE ON monthly_highlights
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_highlights_updated_at();
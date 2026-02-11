/*
  # Create HR Absenteeism Table

  1. New Tables
    - `hr_absenteeism`
      - `id` (uuid, primary key) - Unique identifier
      - `month_ym` (text) - Month in YYYY-MM format
      - `justified_absence` (integer) - Hours of justified absences
      - `unjustified_absence` (integer) - Hours of unjustified absences
      - `expected_workload` (integer) - Expected monthly workload in hours
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on `hr_absenteeism` table
    - Add policy for authenticated users to read data
    - Add policy for authenticated users to insert data
    - Add policy for authenticated users to update data
    - Add policy for authenticated users to delete data

  3. Indexes
    - Add unique index on month_ym for faster queries and prevent duplicates
*/

-- Create the hr_absenteeism table
CREATE TABLE IF NOT EXISTS hr_absenteeism (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_ym text NOT NULL,
  justified_absence integer DEFAULT 0 NOT NULL,
  unjustified_absence integer DEFAULT 0 NOT NULL,
  expected_workload integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create unique index on month_ym
CREATE UNIQUE INDEX IF NOT EXISTS hr_absenteeism_month_ym_idx ON hr_absenteeism(month_ym);

-- Enable RLS
ALTER TABLE hr_absenteeism ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view absenteeism data"
  ON hr_absenteeism FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert absenteeism data"
  ON hr_absenteeism FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update absenteeism data"
  ON hr_absenteeism FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete absenteeism data"
  ON hr_absenteeism FOR DELETE
  TO authenticated
  USING (true);
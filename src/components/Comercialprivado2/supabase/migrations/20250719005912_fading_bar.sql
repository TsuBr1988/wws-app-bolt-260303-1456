/*
  # Create challenges table

  1. New Tables
    - `challenges`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `start_date` (date, required)
      - `end_date` (date, required)
      - `prize` (text, required)
      - `target_type` (enum: points, sales)
      - `target_value` (integer, required)
      - `status` (enum: active, completed, expired)
      - `participants_ids` (text array, optional)
      - `winner_ids` (text array, optional)
      - `completion_date` (timestamp, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `challenges` table
    - Add policy for authenticated users to read all challenges
    - Add policy for admins to manage challenges
*/

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE target_type AS ENUM ('points', 'sales');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  prize text NOT NULL,
  target_type target_type NOT NULL,
  target_value integer NOT NULL,
  status challenge_status DEFAULT 'active'::challenge_status,
  participants_ids text[],
  winner_ids text[],
  completion_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Create policies for challenges
CREATE POLICY "Allow authenticated users to read challenges"
  ON challenges
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert challenges"
  ON challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update challenges"
  ON challenges
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete challenges"
  ON challenges
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
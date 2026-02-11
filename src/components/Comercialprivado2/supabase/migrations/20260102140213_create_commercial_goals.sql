/*
  # Create Commercial Goals Table

  ## Overview
  Creates a separate table for commercial goals, independent from the challenges table.
  This allows the "Metas Comerciais" feature to operate independently from "Desafios e Prêmios".

  ## New Tables
  - `commercial_goals`
    - `id` (uuid, primary key) - Unique identifier
    - `title` (text, required) - Goal title
    - `description` (text, optional) - Goal description
    - `start_date` (date, required) - Goal start date
    - `end_date` (date, required) - Goal end date
    - `prize` (text, required) - Prize or recognition for achieving the goal
    - `target_type` (enum) - Type of target: points, sales, mql, visitas_agendadas, contratos_assinados, pontos_educacao
    - `target_value` (integer, required) - Target value to achieve
    - `status` (enum, default: active) - Status: active, completed, expired
    - `participants_ids` (uuid array, optional) - Array of employee IDs participating in the goal
    - `winner_ids` (uuid array, optional) - Array of employee IDs who achieved the goal
    - `completion_date` (timestamptz, optional) - Date when the goal was completed
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record last update timestamp

  ## Enums
  - `commercial_goal_target_type` - Defines valid target types
  - `commercial_goal_status` - Defines valid statuses

  ## Security
  - Enable RLS on `commercial_goals` table
  - Add policies for authenticated users to read all commercial goals
  - Add policies for authenticated users to insert, update, and delete commercial goals

  ## Notes
  - This table is completely separate from the `challenges` table
  - Uses similar structure to challenges but dedicated to commercial goals
  - Allows independent management of commercial goals vs general challenges
*/

-- Create enum for commercial goal target types
DO $$ BEGIN
  CREATE TYPE commercial_goal_target_type AS ENUM (
    'points',
    'sales',
    'mql',
    'visitas_agendadas',
    'contratos_assinados',
    'pontos_educacao'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for commercial goal status
DO $$ BEGIN
  CREATE TYPE commercial_goal_status AS ENUM (
    'active',
    'completed',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create commercial_goals table
CREATE TABLE IF NOT EXISTS commercial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  prize text NOT NULL,
  target_type commercial_goal_target_type NOT NULL,
  target_value integer NOT NULL,
  status commercial_goal_status DEFAULT 'active',
  participants_ids uuid[],
  winner_ids uuid[],
  completion_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE commercial_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for commercial_goals
CREATE POLICY "Users can view all commercial goals"
  ON commercial_goals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert commercial goals"
  ON commercial_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update commercial goals"
  ON commercial_goals
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete commercial goals"
  ON commercial_goals
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_commercial_goals_status ON commercial_goals(status);

-- Create index on dates for faster date range queries
CREATE INDEX IF NOT EXISTS idx_commercial_goals_dates ON commercial_goals(start_date, end_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_commercial_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commercial_goals_updated_at
  BEFORE UPDATE ON commercial_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_commercial_goals_updated_at();

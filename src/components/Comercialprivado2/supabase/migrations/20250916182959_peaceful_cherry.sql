/*
  # Create REEV integration tables

  1. New Tables
    - `reev_users`
      - Maps REEV users to our system
      - Stores basic user info from REEV API
    - `reev_daily_metrics`
      - Daily metrics per user
      - All performance indicators from REEV
      - Unique constraint on user+day
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    
  3. Indexes
    - Optimized for daily queries and user lookups
    - Support for date range queries
*/

-- REEV Users table
CREATE TABLE IF NOT EXISTS public.reev_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reev_user_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reev_users_reev_user_id ON public.reev_users(reev_user_id);
CREATE INDEX IF NOT EXISTS idx_reev_users_active ON public.reev_users(active) WHERE active = true;

-- REEV Daily Metrics table
CREATE TABLE IF NOT EXISTS public.reev_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reev_user_id text NOT NULL,
  day date NOT NULL,
  emails_sent integer NOT NULL DEFAULT 0,
  emails_opened integer NOT NULL DEFAULT 0,
  meetings_scheduled integer NOT NULL DEFAULT 0,
  bounce_rate numeric(5,2) NOT NULL DEFAULT 0,
  whatsapp_sent integer NOT NULL DEFAULT 0,
  linkedin_sent integer NOT NULL DEFAULT 0,
  calls_made integer NOT NULL DEFAULT 0,
  positive_connections integer NOT NULL DEFAULT 0,
  negative_connections integer NOT NULL DEFAULT 0,
  gatekeeper integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reev_user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_reev_daily_metrics_user_day ON public.reev_daily_metrics(reev_user_id, day);
CREATE INDEX IF NOT EXISTS idx_reev_daily_metrics_day ON public.reev_daily_metrics(day DESC);
CREATE INDEX IF NOT EXISTS idx_reev_daily_metrics_user_id ON public.reev_daily_metrics(reev_user_id);

-- Enable RLS
ALTER TABLE reev_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reev_daily_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reev_users"
  ON reev_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert reev_users"
  ON reev_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update reev_users"
  ON reev_users
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can view reev_daily_metrics"
  ON reev_daily_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert reev_daily_metrics"
  ON reev_daily_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update reev_daily_metrics"
  ON reev_daily_metrics
  FOR UPDATE
  TO authenticated
  USING (true);

-- Update triggers
CREATE OR REPLACE FUNCTION update_reev_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reev_users_updated_at
  BEFORE UPDATE ON reev_users
  FOR EACH ROW
  EXECUTE FUNCTION update_reev_updated_at();

CREATE TRIGGER update_reev_daily_metrics_updated_at
  BEFORE UPDATE ON reev_daily_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_reev_updated_at();
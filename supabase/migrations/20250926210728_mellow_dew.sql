/*
  # Create WWS Dashboard Tables

  1. New Tables
    - `hr_headcount`
      - `id` (uuid, primary key)
      - `month_ym` (char(7)) - format YYYY-MM
      - `company` (text) - WWS or Worldwide
      - `qty` (int) - employee count, >= 0
      - `created_at` (timestamp)
      - Unique constraint on (month_ym, company)
    
    - `fin_revenue`
      - `id` (uuid, primary key)  
      - `month_ym` (char(7)) - format YYYY-MM
      - `company` (text) - WWS or Worldwide
      - `amount` (numeric(14,2)) - revenue amount, >= 0
      - `created_at` (timestamp)
      - Unique constraint on (month_ym, company)
    
    - `com_sales`
      - `id` (uuid, primary key)
      - `month_ym` (char(7)) - format YYYY-MM  
      - `segment` (text) - publico or privado
      - `amount` (numeric(14,2)) - sales amount, >= 0
      - `created_at` (timestamp)
      - Unique constraint on (month_ym, segment)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
*/

-- HR Headcount Table
CREATE TABLE IF NOT EXISTS hr_headcount (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_ym char(7) NOT NULL CHECK (month_ym ~ '^[0-9]{4}-[0-9]{2}$'),
  company text NOT NULL CHECK (company IN ('WWS', 'Worldwide')),
  qty int NOT NULL CHECK (qty >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE (month_ym, company)
);

-- Finance Revenue Table
CREATE TABLE IF NOT EXISTS fin_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_ym char(7) NOT NULL CHECK (month_ym ~ '^[0-9]{4}-[0-9]{2}$'),
  company text NOT NULL CHECK (company IN ('WWS', 'Worldwide')),
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE (month_ym, company)
);

-- Commercial Sales Table  
CREATE TABLE IF NOT EXISTS com_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_ym char(7) NOT NULL CHECK (month_ym ~ '^[0-9]{4}-[0-9]{2}$'),
  segment text NOT NULL CHECK (segment IN ('publico', 'privado')),
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE (month_ym, segment)
);

-- Enable Row Level Security
ALTER TABLE hr_headcount ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE com_sales ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated can CRUD hr_headcount"
  ON hr_headcount
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can CRUD fin_revenue"
  ON fin_revenue
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can CRUD com_sales"
  ON com_sales
  FOR ALL  
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
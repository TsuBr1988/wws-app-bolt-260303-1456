/*
  # Create Administrative Expenses Table

  1. New Tables
    - `fin_administrative_expenses`
      - `id` (uuid, primary key)
      - `company` (text) - Company name (WWS or Worldwide)
      - `department` (text) - Department name (free text input)
      - `month_ym` (text) - Month in YYYY-MM format
      - `amount` (numeric) - Expense amount for the month
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `fin_administrative_expenses` table
    - Add policies for authenticated users to manage their data

  3. Indexes
    - Add index on company for faster filtering
    - Add index on month_ym for faster date-based queries
    - Add unique constraint on (company, department, month_ym) to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS fin_administrative_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL CHECK (company IN ('WWS', 'Worldwide')),
  department text NOT NULL,
  month_ym text NOT NULL,
  amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fin_administrative_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read administrative expenses"
  ON fin_administrative_expenses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert administrative expenses"
  ON fin_administrative_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update administrative expenses"
  ON fin_administrative_expenses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete administrative expenses"
  ON fin_administrative_expenses
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_fin_admin_expenses_company ON fin_administrative_expenses(company);
CREATE INDEX IF NOT EXISTS idx_fin_admin_expenses_month ON fin_administrative_expenses(month_ym);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fin_admin_expenses_unique ON fin_administrative_expenses(company, department, month_ym);
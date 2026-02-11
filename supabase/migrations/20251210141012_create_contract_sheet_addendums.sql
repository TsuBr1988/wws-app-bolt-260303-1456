/*
  # Create Contract Sheet Addendums System

  1. New Tables
    - `contract_sheet_addendums`
      - `id` (uuid, primary key)
      - `sheet_id` (uuid, foreign key to contract_sheets)
      - `addendum_number` (integer) - sequential number for each addendum
      - `effective_date` (date) - when the new values take effect
      - `created_at` (timestamptz)
      - `created_by` (text) - user who created the addendum
      - Unique constraint on (sheet_id, addendum_number)
    
    - `contract_sheet_addendum_items`
      - `id` (uuid, primary key)
      - `addendum_id` (uuid, foreign key to contract_sheet_addendums)
      - `category_code` (text)
      - `category_name` (text)
      - `budgeted_amount` (numeric)
      - Foreign key to contract_sheet_addendums with CASCADE delete

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage addendums

  3. Indexes
    - Index on sheet_id for fast lookups
    - Index on effective_date for date range queries
*/

-- Create contract_sheet_addendums table
CREATE TABLE IF NOT EXISTS contract_sheet_addendums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL REFERENCES contract_sheets(id) ON DELETE CASCADE,
  addendum_number integer NOT NULL,
  effective_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by text,
  UNIQUE(sheet_id, addendum_number)
);

-- Create contract_sheet_addendum_items table
CREATE TABLE IF NOT EXISTS contract_sheet_addendum_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  addendum_id uuid NOT NULL REFERENCES contract_sheet_addendums(id) ON DELETE CASCADE,
  category_code text NOT NULL,
  category_name text NOT NULL,
  budgeted_amount numeric NOT NULL DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sheet_addendums_sheet_id ON contract_sheet_addendums(sheet_id);
CREATE INDEX IF NOT EXISTS idx_sheet_addendums_effective_date ON contract_sheet_addendums(effective_date);
CREATE INDEX IF NOT EXISTS idx_sheet_addendum_items_addendum_id ON contract_sheet_addendum_items(addendum_id);

-- Enable RLS
ALTER TABLE contract_sheet_addendums ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_sheet_addendum_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_sheet_addendums
CREATE POLICY "Users can view all addendums"
  ON contract_sheet_addendums FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create addendums"
  ON contract_sheet_addendums FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update addendums"
  ON contract_sheet_addendums FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete addendums"
  ON contract_sheet_addendums FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for contract_sheet_addendum_items
CREATE POLICY "Users can view all addendum items"
  ON contract_sheet_addendum_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create addendum items"
  ON contract_sheet_addendum_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update addendum items"
  ON contract_sheet_addendum_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete addendum items"
  ON contract_sheet_addendum_items FOR DELETE
  TO authenticated
  USING (true);
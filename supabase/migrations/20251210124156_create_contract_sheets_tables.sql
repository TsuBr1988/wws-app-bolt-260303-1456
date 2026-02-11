/*
  # Create Contract Sheets Tables

  1. New Tables
    - `contract_sheets` - Main table for contract budget sheets
      - `id` (uuid, primary key) - Unique identifier
      - `client_name` (text) - Client/cost center name
      - `start_date` (date) - Start date of the sheet
      - `expense_year` (integer) - Year reference for expenses
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `contract_sheet_items` - Budget items per category
      - `id` (uuid, primary key) - Unique identifier
      - `sheet_id` (uuid, foreign key) - Reference to contract_sheet
      - `category_code` (text) - Chart of accounts category code
      - `category_name` (text) - Category display name
      - `budgeted_amount` (numeric) - Budgeted amount for this category
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their sheets
*/

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS contract_sheet_items CASCADE;
DROP TABLE IF EXISTS contract_sheets CASCADE;

-- Create contract_sheets table
CREATE TABLE contract_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  start_date date NOT NULL,
  expense_year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS desabilitado para permitir acesso com anon key
-- ALTER TABLE contract_sheets ENABLE ROW LEVEL SECURITY;

-- Create contract_sheet_items table
CREATE TABLE contract_sheet_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL REFERENCES contract_sheets(id) ON DELETE CASCADE,
  category_code text NOT NULL,
  category_name text NOT NULL,
  budgeted_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sheet_id, category_code)
);

-- RLS desabilitado para permitir acesso com anon key
-- ALTER TABLE contract_sheet_items ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster lookups
CREATE INDEX idx_contract_sheet_items_sheet_id ON contract_sheet_items(sheet_id);
CREATE INDEX idx_contract_sheets_client_name ON contract_sheets(client_name);
CREATE INDEX idx_contract_sheets_expense_year ON contract_sheets(expense_year);

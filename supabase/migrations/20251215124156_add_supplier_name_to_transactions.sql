/*
  # Add Supplier Name to Transactions

  1. Changes
    - Add `nome` column to `transactions` table to store supplier/provider name
    - Add `nome` column to `transactions_coa2` table for consistency
  
  2. Notes
    - This field stores the supplier/provider name from imported files
    - Defaults to empty string for existing records
*/

-- Add nome column to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'nome'
  ) THEN
    ALTER TABLE transactions ADD COLUMN nome text DEFAULT '';
  END IF;
END $$;

-- Add nome column to transactions_coa2 table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions_coa2') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'transactions_coa2' AND column_name = 'nome'
    ) THEN
      ALTER TABLE transactions_coa2 ADD COLUMN nome text DEFAULT '';
    END IF;
  END IF;
END $$;
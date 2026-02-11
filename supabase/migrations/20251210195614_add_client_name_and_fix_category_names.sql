/*
  # Add client_name to contract_sheet_items and fix category names

  1. Changes
    - Add `client_name` column to `contract_sheet_items` table
    - Populate `client_name` from parent `contract_sheets` table
    - Fix all `category_name` values that are incorrect (showing codes instead of names)
    - Create trigger to automatically populate `client_name` on insert/update
    - Create function to sync `client_name` when contract_sheets.client_name changes

  2. Data Integrity
    - Ensures all existing records have correct `client_name`
    - Ensures all existing records have correct `category_name` from `categorias_dre`
    - Automatic maintenance via triggers for future records

  3. Security
    - No RLS changes needed (RLS is disabled for these tables)
*/

-- Step 1: Add client_name column to contract_sheet_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_sheet_items' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE contract_sheet_items ADD COLUMN client_name text;
  END IF;
END $$;

-- Step 2: Populate client_name from contract_sheets
UPDATE contract_sheet_items csi
SET client_name = cs.client_name
FROM contract_sheets cs
WHERE csi.sheet_id = cs.id
AND (csi.client_name IS NULL OR csi.client_name != cs.client_name);

-- Step 3: Fix category_name values that are incorrect
-- This will update any category_name that doesn't match the proper name in categorias_dre
UPDATE contract_sheet_items csi
SET category_name = cd.nome
FROM categorias_dre cd
WHERE csi.category_code = cd.codigo
AND csi.category_name != cd.nome;

-- Step 4: Create function to automatically set client_name on insert/update
CREATE OR REPLACE FUNCTION set_contract_sheet_item_client_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically populate client_name from the parent contract_sheet
  SELECT client_name INTO NEW.client_name
  FROM contract_sheets
  WHERE id = NEW.sheet_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to call the function before insert or update
DROP TRIGGER IF EXISTS trigger_set_contract_sheet_item_client_name ON contract_sheet_items;

CREATE TRIGGER trigger_set_contract_sheet_item_client_name
  BEFORE INSERT OR UPDATE ON contract_sheet_items
  FOR EACH ROW
  EXECUTE FUNCTION set_contract_sheet_item_client_name();

-- Step 6: Create function to sync client_name when contract_sheets.client_name changes
CREATE OR REPLACE FUNCTION sync_contract_sheet_items_client_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If client_name changed in contract_sheets, update all related items
  IF NEW.client_name != OLD.client_name THEN
    UPDATE contract_sheet_items
    SET client_name = NEW.client_name
    WHERE sheet_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger on contract_sheets to sync changes
DROP TRIGGER IF EXISTS trigger_sync_contract_sheet_items_client_name ON contract_sheets;

CREATE TRIGGER trigger_sync_contract_sheet_items_client_name
  AFTER UPDATE ON contract_sheets
  FOR EACH ROW
  EXECUTE FUNCTION sync_contract_sheet_items_client_name();

-- Step 8: Create index on client_name for faster queries
CREATE INDEX IF NOT EXISTS idx_contract_sheet_items_client_name ON contract_sheet_items(client_name);

-- Step 9: Add NOT NULL constraint to client_name after populating all values
ALTER TABLE contract_sheet_items ALTER COLUMN client_name SET NOT NULL;

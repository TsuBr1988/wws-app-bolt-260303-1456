/*
  # Add client_name to contract_sheet_addendum_items

  1. Changes
    - Add `client_name` column to `contract_sheet_addendum_items` table
    - Populate `client_name` from parent `contract_sheets` table via `contract_sheet_addendums`
    - Create trigger to automatically populate `client_name` on insert/update
    - Create index on client_name for faster queries

  2. Data Integrity
    - Ensures all existing addendum items have correct `client_name`
    - Automatic maintenance via triggers for future records

  3. Security
    - No RLS changes needed (RLS policies already exist for this table)
*/

-- Step 1: Add client_name column to contract_sheet_addendum_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_sheet_addendum_items' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE contract_sheet_addendum_items ADD COLUMN client_name text;
  END IF;
END $$;

-- Step 2: Populate client_name from contract_sheets via contract_sheet_addendums
UPDATE contract_sheet_addendum_items csai
SET client_name = cs.client_name
FROM contract_sheet_addendums csa
JOIN contract_sheets cs ON csa.sheet_id = cs.id
WHERE csai.addendum_id = csa.id
AND (csai.client_name IS NULL OR csai.client_name != cs.client_name);

-- Step 3: Create function to automatically set client_name on insert/update
CREATE OR REPLACE FUNCTION set_contract_sheet_addendum_item_client_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically populate client_name from the parent contract_sheet via addendum
  SELECT cs.client_name INTO NEW.client_name
  FROM contract_sheet_addendums csa
  JOIN contract_sheets cs ON csa.sheet_id = cs.id
  WHERE csa.id = NEW.addendum_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to call the function before insert or update
DROP TRIGGER IF EXISTS trigger_set_contract_sheet_addendum_item_client_name ON contract_sheet_addendum_items;

CREATE TRIGGER trigger_set_contract_sheet_addendum_item_client_name
  BEFORE INSERT OR UPDATE ON contract_sheet_addendum_items
  FOR EACH ROW
  EXECUTE FUNCTION set_contract_sheet_addendum_item_client_name();

-- Step 5: Update the sync function to also update addendum items when contract_sheets.client_name changes
CREATE OR REPLACE FUNCTION sync_contract_sheet_items_client_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If client_name changed in contract_sheets, update all related items
  IF NEW.client_name != OLD.client_name THEN
    -- Update contract_sheet_items
    UPDATE contract_sheet_items
    SET client_name = NEW.client_name
    WHERE sheet_id = NEW.id;
    
    -- Update contract_sheet_addendum_items via addendums
    UPDATE contract_sheet_addendum_items csai
    SET client_name = NEW.client_name
    FROM contract_sheet_addendums csa
    WHERE csai.addendum_id = csa.id
    AND csa.sheet_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create index on client_name for faster queries
CREATE INDEX IF NOT EXISTS idx_contract_sheet_addendum_items_client_name ON contract_sheet_addendum_items(client_name);

-- Step 7: Add NOT NULL constraint to client_name after populating all values
ALTER TABLE contract_sheet_addendum_items ALTER COLUMN client_name SET NOT NULL;

/*
  # Add Comercial Público Access Type Field

  1. Changes
    - Add `comercial_publico_access_type` column to `app_users` table
      - Type: text (nullable)
      - Possible values: 'comercial', 'administrativo', 'interno', or NULL
      - Default: NULL (no specific access type assigned)
  
  2. Purpose
    - Centralize access control for Comercial Público module
    - Replace hardcoded passwords with user-based permissions
    - Enable granular control through user management interface
  
  3. Important Notes
    - NULL means user doesn't have a specific access type configured
    - This field is only relevant for users with comercial_publico page permission
    - Combines with existing indicator permissions for full access control
*/

-- Add comercial_publico_access_type field to app_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_users' AND column_name = 'comercial_publico_access_type'
  ) THEN
    ALTER TABLE app_users ADD COLUMN comercial_publico_access_type text;
  END IF;
END $$;

-- Add constraint to validate access type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_users_comercial_publico_access_type_check'
  ) THEN
    ALTER TABLE app_users 
    ADD CONSTRAINT app_users_comercial_publico_access_type_check 
    CHECK (comercial_publico_access_type IN ('comercial', 'administrativo', 'interno') OR comercial_publico_access_type IS NULL);
  END IF;
END $$;
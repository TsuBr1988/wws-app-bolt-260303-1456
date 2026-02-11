/*
  # Add Permission Level to Indicator Permissions

  1. Changes
    - Add `permission_level` column to `user_indicator_permissions` table
      - Values: 'none' (não visualizar), 'view' (observar), 'edit' (editar)
      - Default: 'view'
    - Remove `can_view` column (replaced by permission_level)
  
  2. Important Notes
    - 'none' = usuário não pode ver o indicador
    - 'view' = usuário pode apenas visualizar
    - 'edit' = usuário pode visualizar e editar
*/

-- Add permission_level column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_indicator_permissions' AND column_name = 'permission_level'
  ) THEN
    ALTER TABLE user_indicator_permissions 
    ADD COLUMN permission_level text DEFAULT 'view' CHECK (permission_level IN ('none', 'view', 'edit'));
  END IF;
END $$;

-- Drop can_view column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_indicator_permissions' AND column_name = 'can_view'
  ) THEN
    ALTER TABLE user_indicator_permissions DROP COLUMN can_view;
  END IF;
END $$;
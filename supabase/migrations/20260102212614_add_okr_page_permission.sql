/*
  # Add OKR Page to User Permissions

  1. Changes
    - Grants access to the 'okr' page for all existing users
  
  2. Security
    - Maintains existing RLS policies
    - All existing users will have access to the new OKR page by default
*/

-- Grant OKR page access to all existing users
INSERT INTO user_permissions (user_id, page, can_view)
SELECT id, 'okr', true
FROM app_users
WHERE NOT EXISTS (
  SELECT 1 FROM user_permissions up
  WHERE up.user_id = app_users.id AND up.page = 'okr'
);

/*
  # Move OKR to Cultura as Indicator
  
  1. Changes
    - Remove OKR as a standalone page permission
    - Add OKR as an indicator within the Cultura page
    - Grant OKR indicator access to all users who had cultura access
  
  2. Security
    - Maintains existing RLS policies
    - Users with cultura access will automatically get OKR indicator access
*/

-- Remove OKR page permissions (no longer a standalone page)
DELETE FROM user_permissions WHERE page = 'okr';

-- Add OKR indicator to all users who have access to cultura page
INSERT INTO user_indicator_permissions (user_id, page, indicator_name, permission_level)
SELECT up.user_id, 'cultura', 'OKR', 'edit'
FROM user_permissions up
WHERE up.page = 'cultura' 
  AND up.can_view = true
  AND NOT EXISTS (
    SELECT 1 FROM user_indicator_permissions uip
    WHERE uip.user_id = up.user_id 
      AND uip.page = 'cultura' 
      AND uip.indicator_name = 'OKR'
  )
ON CONFLICT (user_id, page, indicator_name) 
DO UPDATE SET permission_level = 'edit';

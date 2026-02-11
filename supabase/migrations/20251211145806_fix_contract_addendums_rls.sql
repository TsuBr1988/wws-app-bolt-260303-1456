/*
  # Fix Contract Sheet Addendums RLS

  1. Changes
    - Disable RLS on contract_sheet_addendums table
    - Disable RLS on contract_sheet_addendum_items table
    - Remove existing RLS policies
  
  2. Reason
    - The system uses custom authentication (app_users table) instead of Supabase Auth
    - Related tables (contract_sheets, contract_sheet_items) have RLS disabled for anon key access
    - Need consistency across all contract sheet related tables
  
  3. Security Note
    - Access control is managed at the application level through the custom auth system
    - All tables in this module use anon key access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all addendums" ON contract_sheet_addendums;
DROP POLICY IF EXISTS "Users can create addendums" ON contract_sheet_addendums;
DROP POLICY IF EXISTS "Users can update addendums" ON contract_sheet_addendums;
DROP POLICY IF EXISTS "Users can delete addendums" ON contract_sheet_addendums;

DROP POLICY IF EXISTS "Users can view all addendum items" ON contract_sheet_addendum_items;
DROP POLICY IF EXISTS "Users can create addendum items" ON contract_sheet_addendum_items;
DROP POLICY IF EXISTS "Users can update addendum items" ON contract_sheet_addendum_items;
DROP POLICY IF EXISTS "Users can delete addendum items" ON contract_sheet_addendum_items;

-- Disable RLS to allow anon key access (consistent with contract_sheets and contract_sheet_items)
ALTER TABLE contract_sheet_addendums DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_sheet_addendum_items DISABLE ROW LEVEL SECURITY;

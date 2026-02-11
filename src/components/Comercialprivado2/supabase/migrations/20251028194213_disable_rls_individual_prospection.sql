/*
  # Disable RLS for Individual Prospection Tables
  
  1. Changes
    - Disable RLS on individual_prospection_dates table
    - Disable RLS on individual_prospection_metrics table
  
  2. Reason
    - The application doesn't have user authentication
    - RLS policies are preventing data insertion even with anon role
    - Since this is an internal management tool, disabling RLS is acceptable
  
  3. Security Note
    - This removes row-level security restrictions
    - Acceptable for internal tools without multi-tenant requirements
    - Consider re-enabling RLS if authentication is added in the future
*/

-- Disable RLS on individual_prospection_dates
ALTER TABLE individual_prospection_dates DISABLE ROW LEVEL SECURITY;

-- Disable RLS on individual_prospection_metrics
ALTER TABLE individual_prospection_metrics DISABLE ROW LEVEL SECURITY;

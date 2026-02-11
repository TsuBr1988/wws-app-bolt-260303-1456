/*
  # Disable RLS for Marketing Planning Posts

  1. Changes
    - Disable RLS on marketing_planning_posts table temporarily
    - This allows the application to work without authentication

  2. Note
    - This is a temporary solution for development
    - In production, proper authentication should be implemented
*/

ALTER TABLE marketing_planning_posts DISABLE ROW LEVEL SECURITY;
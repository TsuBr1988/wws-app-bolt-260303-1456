/*
  # Update Marketing Planning Posts Policies

  1. Changes
    - Make created_by nullable
    - Update RLS policies to allow operations without authentication
    - Allow all authenticated users to create, update, and delete posts

  2. Security
    - Maintain RLS enabled
    - Allow all authenticated users full access (suitable for internal tools)
*/

-- Make created_by nullable
ALTER TABLE marketing_planning_posts 
  ALTER COLUMN created_by DROP NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create marketing planning posts" ON marketing_planning_posts;
DROP POLICY IF EXISTS "Users can update marketing planning posts" ON marketing_planning_posts;
DROP POLICY IF EXISTS "Users can delete marketing planning posts" ON marketing_planning_posts;

-- Create new policies that allow all authenticated users
CREATE POLICY "Authenticated users can create marketing planning posts"
  ON marketing_planning_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update marketing planning posts"
  ON marketing_planning_posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete marketing planning posts"
  ON marketing_planning_posts
  FOR DELETE
  TO authenticated
  USING (true);
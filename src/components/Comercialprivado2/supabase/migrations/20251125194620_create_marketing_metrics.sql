/*
  # Create Marketing Metrics Tables

  1. New Tables
    - `marketing_instagram`
      - `id` (uuid, primary key)
      - `date` (date, unique)
      - `followers` (integer)
      - `photo_posts` (integer)
      - `video_posts` (integer)
      - `story_posts` (integer)
      - `likes` (integer)
      - `photo_views` (integer)
      - `video_views` (integer)
      - `story_views` (integer)
      - `shares` (integer)
      - `comments` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `marketing_linkedin`
      - `id` (uuid, primary key)
      - `date` (date, unique)
      - `followers` (integer)
      - `photo_posts` (integer)
      - `video_posts` (integer)
      - `impressions` (integer)
      - `views` (integer)
      - `clicks` (integer)
      - `comments` (integer)
      - `shares` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data
*/

-- Create marketing_instagram table
CREATE TABLE IF NOT EXISTS marketing_instagram (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  followers integer DEFAULT 0,
  photo_posts integer DEFAULT 0,
  video_posts integer DEFAULT 0,
  story_posts integer DEFAULT 0,
  likes integer DEFAULT 0,
  photo_views integer DEFAULT 0,
  video_views integer DEFAULT 0,
  story_views integer DEFAULT 0,
  shares integer DEFAULT 0,
  comments integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create marketing_linkedin table
CREATE TABLE IF NOT EXISTS marketing_linkedin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  followers integer DEFAULT 0,
  photo_posts integer DEFAULT 0,
  video_posts integer DEFAULT 0,
  impressions integer DEFAULT 0,
  views integer DEFAULT 0,
  clicks integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketing_instagram ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_linkedin ENABLE ROW LEVEL SECURITY;

-- Policies for marketing_instagram
CREATE POLICY "Allow authenticated users to read Instagram metrics"
  ON marketing_instagram FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert Instagram metrics"
  ON marketing_instagram FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update Instagram metrics"
  ON marketing_instagram FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete Instagram metrics"
  ON marketing_instagram FOR DELETE
  TO authenticated
  USING (true);

-- Policies for marketing_linkedin
CREATE POLICY "Allow authenticated users to read LinkedIn metrics"
  ON marketing_linkedin FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert LinkedIn metrics"
  ON marketing_linkedin FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update LinkedIn metrics"
  ON marketing_linkedin FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete LinkedIn metrics"
  ON marketing_linkedin FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_marketing_instagram_date ON marketing_instagram(date DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_linkedin_date ON marketing_linkedin(date DESC);
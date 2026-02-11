/*
  # Create employees table

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable, reference to auth.users)
      - `name` (text)
      - `email` (text, unique)
      - `avatar` (text, default empty)
      - `department` (text, default empty)
      - `position` (text)
      - `role` (enum: SDR, Closer, Admin, default SDR)
      - `points` (integer, default 0)
      - `level` (integer, default 1)
      - `admission_date` (date, default current date)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Disable RLS (following project pattern)
*/

-- Create role enum type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE employee_role AS ENUM ('SDR', 'Closer', 'Admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  avatar text DEFAULT '',
  department text DEFAULT '',
  position text NOT NULL,
  role employee_role DEFAULT 'SDR',
  points integer DEFAULT 0 CHECK (points >= 0),
  level integer DEFAULT 1 CHECK (level >= 1),
  admission_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disable RLS (following project pattern)
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
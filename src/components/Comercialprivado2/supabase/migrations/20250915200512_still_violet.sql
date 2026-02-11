/*
  # Create tasks table and setup

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `assignee_id` (uuid, foreign key to prospection_users)
      - `created_by` (uuid, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `due_date` (date)
      - `status` (text with check constraint)
      - `title` (text)
      - `description` (text)
      - `finished_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `tasks` table
    - Add policies for authenticated users to manage tasks

  3. Indexes
    - Index on assignee_id for performance
    - Index on due_date for filtering
    - Index on status for filtering

  4. Triggers
    - Auto-update updated_at timestamp
    - Auto-set finished_at when status changes to 'feito'
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee_id uuid NOT NULL REFERENCES public.prospection_users(id) ON DELETE CASCADE,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  due_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('a_fazer', 'fazendo', 'feito')),
  title text NOT NULL,
  description text NOT NULL,
  finished_at timestamptz NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_finished_at ON public.tasks(finished_at) WHERE finished_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Auto-set finished_at when status changes to 'feito'
  IF NEW.status = 'feito' AND OLD.status != 'feito' AND NEW.finished_at IS NULL THEN
    NEW.finished_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();
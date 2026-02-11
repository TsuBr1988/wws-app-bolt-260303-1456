/*
  # Create Actions Table (Atas e Ações)

  1. New Tables
    - `actions`
      - `id` (uuid, primary key) - ID único da ação
      - `descricao` (text, required) - Descrição da ação
      - `responsavel` (text, required) - Nome do responsável pela ação
      - `data_prazo` (date, required) - Data de prazo para conclusão
      - `status` (text, required) - Status da ação: 'a_fazer', 'fazendo', 'feito'
      - `created_at` (timestamptz) - Data de criação automática
      - `updated_at` (timestamptz) - Data de atualização automática
  
  2. Security
    - Enable RLS on `actions` table
    - Add policies for public access
  
  3. Indexes
    - Index on status for filtering
    - Index on data_prazo for sorting
  
  4. Important Notes
    - Status options: 'a_fazer' (A Fazer), 'fazendo' (Fazendo), 'feito' (Feito)
    - Data de criação é automática via created_at
    - Data de prazo é manual, inserida pelo usuário
*/

-- Create actions table
CREATE TABLE IF NOT EXISTS actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  responsavel text NOT NULL,
  data_prazo date NOT NULL,
  status text NOT NULL DEFAULT 'a_fazer' CHECK (status IN ('a_fazer', 'fazendo', 'feito')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for actions
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_data_prazo ON actions(data_prazo);
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON actions(created_at DESC);

-- Enable RLS
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for actions
CREATE POLICY "Allow public read access to actions"
  ON actions FOR SELECT TO public USING (true);

CREATE POLICY "Allow public write access to actions"
  ON actions FOR ALL TO public WITH CHECK (true);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_actions_updated_at ON actions;
CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
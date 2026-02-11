/*
  # Sistema de Observações para Licitações

  1. Nova Tabela
    - `proposal_notes`
      - `id` (uuid, primary key)
      - `proposal_id` (uuid, foreign key)
      - `text` (text, conteúdo da observação)
      - `author_name` (text, opcional)
      - `created_at` (timestamp)

  2. Segurança
    - Enable RLS on `proposal_notes` table
    - Add policy for public read/write access

  3. Índices
    - Index on proposal_id for performance
    - Index on created_at for ordering
*/

-- Criar tabela proposal_notes
CREATE TABLE IF NOT EXISTS proposal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  text text NOT NULL,
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_proposal_notes_proposal_id ON proposal_notes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_notes_created_at ON proposal_notes(created_at DESC);

-- Habilitar RLS
ALTER TABLE proposal_notes ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Allow public read access to proposal_notes"
  ON proposal_notes
  FOR SELECT
  TO public
  USING (true);

-- Política para inserção pública
CREATE POLICY "Allow public insert access to proposal_notes"
  ON proposal_notes
  FOR INSERT
  TO public
  WITH CHECK (true);
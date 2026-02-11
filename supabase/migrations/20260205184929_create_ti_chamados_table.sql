/*
  # Criar tabela de Chamados de TI

  1. Nova Tabela
    - `ti_chamados`
      - `id` (uuid, primary key)
      - `titulo` (text) - Título do chamado
      - `descricao` (text) - Descrição detalhada
      - `prioridade` (text) - Baixa, Média, Alta, Crítica
      - `categoria` (text) - Hardware, Software, Rede, Acesso, Outros
      - `status` (text) - Aberto, Em Andamento, Aguardando, Concluído, Cancelado
      - `solicitante_nome` (text) - Nome de quem abriu
      - `solicitante_email` (text) - Email do solicitante
      - `responsavel_id` (uuid, nullable) - ID do técnico responsável
      - `responsavel_nome` (text, nullable) - Nome do responsável
      - `data_abertura` (timestamptz) - Data de criação
      - `data_inicio` (timestamptz, nullable) - Quando começou a ser atendido
      - `data_conclusao` (timestamptz, nullable) - Quando foi concluído
      - `prazo_estimado` (timestamptz, nullable) - Prazo esperado de conclusão
      - `observacoes` (text, nullable) - Notas internas
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Allow authenticated users to read all chamados
    - Allow authenticated users to create chamados
    - Allow authenticated users to update chamados
*/

-- Criar tabela de chamados
CREATE TABLE IF NOT EXISTS ti_chamados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL CHECK (TRIM(titulo) <> ''),
  descricao text NOT NULL,
  prioridade text NOT NULL DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  categoria text NOT NULL DEFAULT 'Outros' CHECK (categoria IN ('Hardware', 'Software', 'Rede', 'Acesso', 'Email', 'Telefonia', 'Impressora', 'Outros')),
  status text NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Andamento', 'Aguardando', 'Concluído', 'Cancelado')),
  solicitante_nome text NOT NULL,
  solicitante_email text NOT NULL,
  responsavel_id uuid,
  responsavel_nome text,
  data_abertura timestamptz NOT NULL DEFAULT now(),
  data_inicio timestamptz,
  data_conclusao timestamptz,
  prazo_estimado timestamptz,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ti_chamados ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users to read all chamados
CREATE POLICY "Authenticated users can read all chamados"
  ON ti_chamados FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert chamados
CREATE POLICY "Authenticated users can create chamados"
  ON ti_chamados FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update chamados
CREATE POLICY "Authenticated users can update chamados"
  ON ti_chamados FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete chamados
CREATE POLICY "Authenticated users can delete chamados"
  ON ti_chamados FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ti_chamados_status ON ti_chamados(status);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_data_abertura ON ti_chamados(data_abertura DESC);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_responsavel_id ON ti_chamados(responsavel_id);

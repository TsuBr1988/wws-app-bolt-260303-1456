/*
  # Sistema de Troca de Notas

  1. Novas Tabelas
    - `note_exchanges`
      - `id` (uuid, chave primária)
      - `operation_number` (text) - Número da operação
      - `interest_rate` (numeric) - Taxa de juros (%)
      - `due_date` (date) - Data de vencimento da operação
      - `total_gross_amount` (numeric) - Valor total bruto (calculado)
      - `total_net_amount` (numeric) - Valor total líquido (calculado)
      - `loan_id` (uuid, nullable) - Referência ao empréstimo gerado
      - `status` (text) - pending, completed
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `note_exchange_items`
      - `id` (uuid, chave primária)
      - `exchange_id` (uuid, foreign key) - Referência à operação de troca
      - `company` (text) - Empresa
      - `client` (text) - Cliente
      - `contract` (text) - Contrato
      - `gross_amount` (numeric) - Valor bruto
      - `net_amount` (numeric) - Valor líquido
      - `reference` (text) - Referência
      - `original_due_date` (date) - Vencimento original
      - `note_number` (text) - Número da nota
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - RLS habilitado em ambas as tabelas
    - Políticas para usuários autenticados
*/

-- Criar tabela de operações de troca de notas
CREATE TABLE IF NOT EXISTS note_exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_number text NOT NULL,
  interest_rate numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  total_gross_amount numeric NOT NULL DEFAULT 0,
  total_net_amount numeric NOT NULL DEFAULT 0,
  loan_id uuid REFERENCES loans(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de notas trocadas
CREATE TABLE IF NOT EXISTS note_exchange_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES note_exchanges(id) ON DELETE CASCADE,
  company text NOT NULL,
  client text NOT NULL,
  contract text NOT NULL,
  gross_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  reference text NOT NULL,
  original_due_date date NOT NULL,
  note_number text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_note_exchanges_operation_number ON note_exchanges(operation_number);
CREATE INDEX IF NOT EXISTS idx_note_exchanges_due_date ON note_exchanges(due_date);
CREATE INDEX IF NOT EXISTS idx_note_exchanges_status ON note_exchanges(status);
CREATE INDEX IF NOT EXISTS idx_note_exchanges_loan_id ON note_exchanges(loan_id);
CREATE INDEX IF NOT EXISTS idx_note_exchange_items_exchange_id ON note_exchange_items(exchange_id);

-- Habilitar RLS
ALTER TABLE note_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_exchange_items ENABLE ROW LEVEL SECURITY;

-- Políticas para note_exchanges
CREATE POLICY "Usuários autenticados podem visualizar trocas de notas"
  ON note_exchanges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar trocas de notas"
  ON note_exchanges FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar trocas de notas"
  ON note_exchanges FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar trocas de notas"
  ON note_exchanges FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para note_exchange_items
CREATE POLICY "Usuários autenticados podem visualizar itens de troca"
  ON note_exchange_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar itens de troca"
  ON note_exchange_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar itens de troca"
  ON note_exchange_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar itens de troca"
  ON note_exchange_items FOR DELETE
  TO authenticated
  USING (true);
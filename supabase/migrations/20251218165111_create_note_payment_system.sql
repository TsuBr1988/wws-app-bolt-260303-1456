/*
  # Sistema de Pagamento de Notas Trocadas

  1. Novas Tabelas
    - `payment_notes`
      - Armazena notas disponíveis para efetuar pagamentos
      - Controla o valor total e o resquício disponível
      - Campos: note_number, reference, client_name, total_amount, remaining_amount

    - `note_payments`
      - Registra os pagamentos realizados nas notas trocadas
      - Vincula a nota trocada com a nota usada para pagamento
      - Campos: note_exchange_item_id, payment_date, amount_paid, payment_note_id

  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para usuários autenticados realizarem operações CRUD

  3. Constraints
    - Verifica que remaining_amount não seja negativo
    - Garante integridade referencial entre tabelas
*/

-- Tabela de notas disponíveis para pagamento
CREATE TABLE IF NOT EXISTS payment_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_number text NOT NULL,
    reference text NOT NULL,
    client_name text NOT NULL,
    total_amount numeric NOT NULL DEFAULT 0,
    remaining_amount numeric NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT positive_amounts CHECK (total_amount >= 0 AND remaining_amount >= 0 AND remaining_amount <= total_amount)
);

-- Tabela de pagamentos realizados
CREATE TABLE IF NOT EXISTS note_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_exchange_item_id uuid NOT NULL REFERENCES note_exchange_items(id) ON DELETE CASCADE,
    payment_date date NOT NULL,
    amount_paid numeric NOT NULL DEFAULT 0,
    payment_note_id uuid NOT NULL REFERENCES payment_notes(id) ON DELETE RESTRICT,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT positive_payment CHECK (amount_paid > 0)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payment_notes_remaining ON payment_notes(remaining_amount) WHERE remaining_amount > 0;
CREATE INDEX IF NOT EXISTS idx_note_payments_item ON note_payments(note_exchange_item_id);
CREATE INDEX IF NOT EXISTS idx_note_payments_note ON note_payments(payment_note_id);

-- Enable RLS
ALTER TABLE payment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_notes
CREATE POLICY "Usuários autenticados podem visualizar notas de pagamento"
    ON payment_notes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem criar notas de pagamento"
    ON payment_notes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar notas de pagamento"
    ON payment_notes FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar notas de pagamento"
    ON payment_notes FOR DELETE
    TO authenticated
    USING (true);

-- Políticas para note_payments
CREATE POLICY "Usuários autenticados podem visualizar pagamentos"
    ON note_payments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem criar pagamentos"
    ON note_payments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar pagamentos"
    ON note_payments FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar pagamentos"
    ON note_payments FOR DELETE
    TO authenticated
    USING (true);

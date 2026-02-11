/*
  # Conectar Notas de Troca com Notas de Pagamento

  1. Alterações em Tabelas
    - Adicionar `note_exchange_item_id` em `payment_notes` para rastrear origem
    - Permitir que notas criadas em operações fiquem disponíveis para pagamento

  2. Triggers
    - Criar trigger para automaticamente adicionar note_exchange_item como payment_note quando criada
    - Atualizar remaining_amount quando uma nota for criada

  3. Funções
    - Função para criar payment_note automaticamente de note_exchange_item
    - Função para atualizar saldos quando pagamentos forem feitos

  4. Notas
    - Notas criadas em operações ficam disponíveis para pagar qualquer operação
    - Notas manuais (sem note_exchange_item_id) podem ser criadas livremente
    - O remaining_amount controla quanto da nota ainda está disponível para uso
*/

-- Adicionar coluna para rastrear origem da nota de pagamento
ALTER TABLE payment_notes
ADD COLUMN IF NOT EXISTS note_exchange_item_id uuid REFERENCES note_exchange_items(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_payment_notes_exchange_item ON payment_notes(note_exchange_item_id);

-- Função para criar payment_note automaticamente quando note_exchange_item é criado
CREATE OR REPLACE FUNCTION create_payment_note_from_exchange_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar uma payment_note correspondente à note_exchange_item
    INSERT INTO payment_notes (
        note_number,
        reference,
        client_name,
        total_amount,
        remaining_amount,
        note_exchange_item_id
    ) VALUES (
        NEW.note_number,
        NEW.reference,
        NEW.client,
        NEW.gross_amount,
        NEW.gross_amount, -- Inicialmente, o valor total está disponível
        NEW.id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para adicionar payment_note automaticamente
DROP TRIGGER IF EXISTS trigger_create_payment_note_from_exchange ON note_exchange_items;
CREATE TRIGGER trigger_create_payment_note_from_exchange
    AFTER INSERT ON note_exchange_items
    FOR EACH ROW
    EXECUTE FUNCTION create_payment_note_from_exchange_item();

-- Função para atualizar remaining_amount da payment_note quando um pagamento é feito
CREATE OR REPLACE FUNCTION update_payment_note_remaining_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Reduzir o remaining_amount da nota de pagamento usada
    UPDATE payment_notes
    SET
        remaining_amount = remaining_amount - NEW.amount_paid,
        updated_at = now()
    WHERE id = NEW.payment_note_id;

    -- Verificar se remaining_amount não ficou negativo (segurança extra)
    IF (SELECT remaining_amount FROM payment_notes WHERE id = NEW.payment_note_id) < 0 THEN
        RAISE EXCEPTION 'Saldo insuficiente na nota de pagamento';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar saldo quando pagamento é feito
DROP TRIGGER IF EXISTS trigger_update_payment_note_remaining ON note_payments;
CREATE TRIGGER trigger_update_payment_note_remaining
    AFTER INSERT ON note_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_note_remaining_amount();

-- Função para restaurar remaining_amount quando um pagamento é deletado
CREATE OR REPLACE FUNCTION restore_payment_note_remaining_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Restaurar o remaining_amount da nota de pagamento
    UPDATE payment_notes
    SET
        remaining_amount = remaining_amount + OLD.amount_paid,
        updated_at = now()
    WHERE id = OLD.payment_note_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para restaurar saldo quando pagamento é deletado
DROP TRIGGER IF EXISTS trigger_restore_payment_note_remaining ON note_payments;
CREATE TRIGGER trigger_restore_payment_note_remaining
    AFTER DELETE ON note_payments
    FOR EACH ROW
    EXECUTE FUNCTION restore_payment_note_remaining_amount();

-- Criar payment_notes para note_exchange_items existentes (migração de dados existentes)
INSERT INTO payment_notes (
    note_number,
    reference,
    client_name,
    total_amount,
    remaining_amount,
    note_exchange_item_id
)
SELECT
    nei.note_number,
    nei.reference,
    nei.client,
    nei.gross_amount,
    nei.gross_amount - COALESCE(
        (SELECT SUM(np.amount_paid)
         FROM note_payments np
         WHERE np.note_exchange_item_id = nei.id),
        0
    ) as remaining_amount,
    nei.id
FROM note_exchange_items nei
WHERE NOT EXISTS (
    SELECT 1 FROM payment_notes pn
    WHERE pn.note_exchange_item_id = nei.id
);

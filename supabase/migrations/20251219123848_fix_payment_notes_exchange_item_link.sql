/*
  # Adicionar link entre payment_notes e note_exchange_items

  1. Alterações
    - Adiciona coluna `note_exchange_item_id` em `payment_notes`
    - Cria índice para performance
    - Sincroniza dados existentes

  2. Motivo
    - Rastrear a origem de cada nota de pagamento
    - Permitir vincular payment_notes aos note_exchange_items originais
*/

-- Adicionar coluna para rastrear origem da nota de pagamento
ALTER TABLE payment_notes
ADD COLUMN IF NOT EXISTS note_exchange_item_id uuid REFERENCES note_exchange_items(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_payment_notes_exchange_item ON payment_notes(note_exchange_item_id);

-- Sincronizar dados existentes (vincular payment_notes órfãs aos seus note_exchange_items)
-- Tentar vincular por note_number e reference
UPDATE payment_notes pn
SET note_exchange_item_id = nei.id
FROM note_exchange_items nei
WHERE pn.note_exchange_item_id IS NULL
  AND pn.note_number = nei.note_number
  AND pn.reference = nei.reference;

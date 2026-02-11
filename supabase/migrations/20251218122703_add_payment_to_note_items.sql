/*
  # Adicionar campos de pagamento para notas trocadas

  1. Alterações
    - Adiciona campo `paid` (boolean) em `note_exchange_items`
    - Adiciona campo `payment_date` (date) em `note_exchange_items`
    - Adiciona valores padrão apropriados

  2. Motivo
    - Permitir rastrear o pagamento de cada nota individualmente
    - Notas diferentes podem ter pagamentos em datas diferentes
*/

-- Adicionar campos de pagamento para notas
ALTER TABLE note_exchange_items
ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_date date;

-- Criar índice para consultas de notas pagas
CREATE INDEX IF NOT EXISTS idx_note_exchange_items_paid ON note_exchange_items(paid);

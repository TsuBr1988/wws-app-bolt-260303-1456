/*
  # Sincronizar Notas Existentes para Payment Notes
  
  1. Propósito
    - Criar registros de payment_notes para todas as note_exchange_items existentes
    - Permitir que notas já criadas fiquem disponíveis para uso em pagamentos
    
  2. Detalhes
    - Identifica note_exchange_items que não têm payment_note correspondente
    - Cria payment_notes com os dados das notas de troca
    - Usa o valor líquido (net_amount) como valor disponível
    - Vincula através do campo note_exchange_item_id
    
  3. Notas Importantes
    - Executa apenas uma vez para sincronizar dados históricos
    - Novas notas criadas após esta migração já terão payment_notes automáticos
*/

-- Criar payment_notes para todas as note_exchange_items que ainda não têm
INSERT INTO payment_notes (
    note_number,
    reference,
    client_name,
    total_amount,
    remaining_amount,
    note_exchange_item_id,
    created_at,
    updated_at
)
SELECT 
    nei.note_number,
    nei.reference,
    nei.client,
    nei.net_amount,
    nei.net_amount,
    nei.id,
    nei.created_at,
    nei.updated_at
FROM note_exchange_items nei
LEFT JOIN payment_notes pn ON pn.note_exchange_item_id = nei.id
WHERE pn.id IS NULL;

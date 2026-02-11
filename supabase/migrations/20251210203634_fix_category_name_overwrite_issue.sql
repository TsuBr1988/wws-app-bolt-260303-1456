/*
  # Corrigir sobrescrita de category_name nas fichas de contratos

  1. Descrição
    - Remove todos os triggers e funções que sobrescrevem category_name
    - Mantém apenas a funcionalidade de sincronização do client_name
    - Preserva os nomes de categorias corretos que vêm da interface

  2. Mudanças
    - Remove UPDATEs automáticos de category_name baseados em categorias_dre
    - Atualiza função set_contract_sheet_item_client_name para não modificar category_name
    - Mantém triggers de sincronização de client_name

  3. Justificativa
    - Os nomes corretos já vêm do chartOfAccountsTree (construído das transações reais)
    - A tabela categorias_dre contém apenas nomes genéricos
    - Nomes personalizados como "1.1.1 recebimentos wws" devem ser preservados
*/

-- Step 1: Recriar a função set_contract_sheet_item_client_name SEM modificar category_name
CREATE OR REPLACE FUNCTION set_contract_sheet_item_client_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically populate client_name from the parent contract_sheet
  -- IMPORTANTE: NÃO modificar category_name, pois ele já vem correto da interface
  SELECT client_name INTO NEW.client_name
  FROM contract_sheets
  WHERE id = NEW.sheet_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: O trigger já existe e não precisa ser recriado, apenas a função foi atualizada
-- O trigger trigger_set_contract_sheet_item_client_name continuará funcionando com a nova função

-- Step 2: Garantir que a função sync_contract_sheet_items_client_name também não modifica category_name
-- (Esta função já está correta, apenas sincroniza client_name quando contract_sheets.client_name muda)
-- Não há necessidade de alterá-la, pois ela já faz apenas o que deve fazer

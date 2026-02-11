/*
  # Corrigir índice único da tabela financial_station_results

  1. Problema
    - Após remover a coluna `company`, o índice único ficou quebrado
    - O upsert com onConflict 'contract_name,month_ym' não funciona sem o índice único correto
    
  2. Solução
    - Remover índices únicos antigos que incluíam `company`
    - Criar novo índice único apenas em (contract_name, month_ym)
    
  3. Impacto
    - Permite que os upserts funcionem corretamente
    - Evita duplicação de dados
*/

-- Remover índice único antigo que incluía company
DROP INDEX IF EXISTS idx_financial_station_results_unique_key;
DROP INDEX IF EXISTS idx_financial_station_results_unique;

-- Criar novo índice único sem company
CREATE UNIQUE INDEX IF NOT EXISTS idx_station_results_unique
  ON financial_station_results (contract_name, month_ym);

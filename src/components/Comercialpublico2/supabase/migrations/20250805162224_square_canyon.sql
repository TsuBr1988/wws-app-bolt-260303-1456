/*
  # Adicionar campo de texto para próxima ação

  1. Nova Coluna
    - `proxima_acao_texto` (text, nullable)
      - Campo de texto livre para descrever detalhes da próxima ação
      - Permite descrições mais detalhadas além da data/hora

  2. Modificações
    - Adiciona coluna na tabela `proposals`
    - Campo opcional (nullable)
    - Sem restrições de tamanho
*/

-- Adicionar coluna para texto da próxima ação
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS proxima_acao_texto text;
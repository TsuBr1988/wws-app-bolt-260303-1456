/*
  # Adicionar pontos_educacao ao enum target_type

  1. Alterações no Enum
    - Adiciona 'pontos_educacao' como valor válido para target_type
    - Permite criar desafios baseados em pontos de educação
  
  2. Compatibilidade
    - Mantém todos os valores existentes do enum
    - Não afeta desafios já criados
*/

-- Adicionar 'pontos_educacao' ao enum target_type
ALTER TYPE target_type ADD VALUE IF NOT EXISTS 'pontos_educacao';
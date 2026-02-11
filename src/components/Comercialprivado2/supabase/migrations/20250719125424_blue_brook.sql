/*
  # Adicionar pontos_educacao ao enum target_type

  1. Modificações
    - Adiciona 'pontos_educacao' como valor válido no enum target_type
    - Permite criar desafios baseados em pontos de educação
    - Mantém compatibilidade com valores existentes

  2. Segurança
    - Operação segura que não afeta dados existentes
    - Apenas adiciona nova opção ao enum
    - Não remove ou modifica valores existentes
*/

-- Adicionar 'pontos_educacao' ao enum target_type se não existir
ALTER TYPE target_type ADD VALUE IF NOT EXISTS 'pontos_educacao';
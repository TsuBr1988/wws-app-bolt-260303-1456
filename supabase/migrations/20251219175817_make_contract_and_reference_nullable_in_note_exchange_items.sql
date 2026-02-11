/*
  # Tornar campos contract e reference opcionais

  1. Alterações
    - Remover constraint NOT NULL da coluna `contract` em `note_exchange_items`
    - Remover constraint NOT NULL da coluna `reference` em `note_exchange_items`
    
  2. Motivo
    - Os campos contract e reference não são mais obrigatórios na interface
    - Permitir que os usuários adicionem notas sem precisar informar esses campos
*/

-- Tornar a coluna contract opcional
ALTER TABLE note_exchange_items 
ALTER COLUMN contract DROP NOT NULL;

-- Tornar a coluna reference opcional
ALTER TABLE note_exchange_items 
ALTER COLUMN reference DROP NOT NULL;
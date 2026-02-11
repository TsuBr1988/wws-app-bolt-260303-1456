/*
  # Alterar tipo do campo reward_amount para text

  1. Mudanças
    - Altera a coluna `reward_amount` de `numeric` para `text`
    - Permite que o prêmio seja descrito como texto livre (ex: "Mais um salário", "Viagem para Paris", etc)
  
  2. Notas
    - Esta alteração permite maior flexibilidade na descrição dos prêmios
    - Valores numéricos antigos serão convertidos automaticamente para texto
*/

-- Alterar o tipo da coluna reward_amount de numeric para text
ALTER TABLE challenges 
ALTER COLUMN reward_amount TYPE text 
USING reward_amount::text;
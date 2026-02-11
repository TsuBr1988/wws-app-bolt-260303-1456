/*
  # Permitir descrição nula na tabela challenges

  1. Mudanças
    - Altera a coluna `description` para aceitar valores NULL
    - Isso permite criar desafios sem descrição obrigatória
  
  2. Notas
    - A descrição é um campo opcional na interface
    - Deve refletir isso no banco de dados
*/

-- Permitir NULL na coluna description
ALTER TABLE challenges 
ALTER COLUMN description DROP NOT NULL;
/*
  # Cria mapeamento para Impostos Retidos em Nota

  1. Mudanças
    - Atualiza a categoria com código 1.99 para o nome "Impostos retidos em nota"
    - Esta categoria consolidará todos os impostos retidos sobre a receita

  2. Detalhes
    - A edge function irá mapear as seguintes categorias para 1.99:
      - ISS Retido sobre a Receita
      - IRPJ Retido sobre a Receita  
      - INSS Retido sobre a Receita
      - PIS Retido sobre a Receita
      - COFINS Retido sobre a Receita
    - O código 1.99 pertence ao grupo "IRSR - Imposto Retido s/ Receita"
*/

-- Atualiza a categoria existente com código 1.99 para o nome consolidado
UPDATE categorias_dre 
SET nome = 'Impostos retidos em nota'
WHERE codigo = '1.99';

-- Cria a categoria se não existir (caso a migration anterior não tenha sido executada)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categorias_dre WHERE codigo = '1.99') THEN
    INSERT INTO categorias_dre (codigo, nome, grupo, natureza, ordem)
    VALUES ('1.99', 'Impostos retidos em nota', 'IRSR - Imposto Retido s/ Receita', 'receita', 99);
  END IF;
END $$;
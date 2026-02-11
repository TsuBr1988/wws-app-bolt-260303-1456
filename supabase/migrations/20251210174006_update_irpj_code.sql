/*
  # Atualiza código da categoria IRPJ Retido

  1. Mudanças
    - Adiciona o código 1.99 à categoria "IRPJ Retido sobre a Receita"
    - Esta categoria já existia mas sem código

  2. Detalhes
    - Código anterior: null
    - Código novo: 1.99
*/

-- Atualizar código da categoria IRPJ
UPDATE categorias_dre 
SET codigo = '1.99'
WHERE nome = 'IRPJ Retido sobre a Receita' 
  AND grupo = 'IRSR - Imposto Retido s/ Receita'
  AND codigo IS NULL;
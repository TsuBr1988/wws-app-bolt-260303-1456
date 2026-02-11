/*
  # Corrigir nomes das categorias nas fichas de contratos
  
  1. Descrição
    - Atualiza os nomes das categorias em contract_sheet_items para usar os nomes corretos da tabela categorias_dre
    - Garante que category_name corresponde ao nome real da categoria e não ao código
  
  2. Mudanças
    - UPDATE em contract_sheet_items.category_name baseado em categorias_dre.nome
    - Usa LEFT JOIN para atualizar apenas os registros que têm correspondência
*/

-- Atualizar nomes das categorias existentes
UPDATE contract_sheet_items csi
SET category_name = cd.nome
FROM categorias_dre cd
WHERE csi.category_code = cd.codigo
AND (csi.category_name != cd.nome OR csi.category_name = csi.category_code);

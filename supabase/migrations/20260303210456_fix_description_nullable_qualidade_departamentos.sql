/*
  # Corrigir coluna description para aceitar valores nulos

  1. Alterações
    - Remove a restrição NOT NULL da coluna description
    - Adiciona um valor default vazio para description
*/

-- Alterar coluna description para aceitar null e ter default vazio
ALTER TABLE qualidade_procedimentos_departamentos 
  ALTER COLUMN description DROP NOT NULL,
  ALTER COLUMN description SET DEFAULT '';

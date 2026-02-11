/*
  # Adiciona códigos de subgrupo (2 níveis) faltantes

  1. Novos Registros
    - Adiciona códigos de 2 níveis (ex: 1.1, 2.1) que servem como agrupadores
    - Estes códigos aparecem nas fichas de contrato mas não existiam no catálogo
    - Cada código recebe um nome descritivo baseado nas categorias filhas

  2. Detalhes
    - 1.1 - Recebimentos WWS
    - 1.2 - Recebimentos Worldwide
    - 1.3 - Recebimentos Estacionamento e Outros
    - 2.1 - Folha e Benefícios - Postos
    - 2.2 - Veículos - Postos
    - 2.3 - Equipamentos e Materiais - Postos
    - 2.4 - Monitoramento e Segurança - Postos
    - 2.5 - Processos Trabalhistas - Postos
    - 2.6 - Impostos sobre Serviços
    - 2.7 - Insumos e Comissões - Postos
    - 2.8 - Sistemas e Telefonia - Postos
    - 3.8 - Despesas Comerciais
    - 3.9 - Veículos - Comercial
    - 3.10 - Insumos e Comissões - Comercial
*/

-- Verificar se os códigos já existem antes de inserir
INSERT INTO categorias_dre (ordem, codigo, nome, grupo, natureza)
SELECT * FROM (VALUES
  (1.5, '1.1', 'Recebimentos WWS', 'Receita Bruta', 'receita'),
  (2.5, '1.2', 'Recebimentos Worldwide', 'Receita Bruta', 'receita'),
  (3.5, '1.3', 'Recebimentos Estacionamento e Outros', 'Receita Bruta', 'receita'),
  (13.5, '2.6', 'Impostos sobre Serviços', 'IRSR - Imposto Retido s/ Receita', 'receita'),
  (23.5, '2.1', 'Folha e Benefícios - Postos', 'CSV - Custo Serviço Vendido', 'custo'),
  (49.5, '2.2', 'Veículos - Postos', 'CSV - Custo Serviço Vendido', 'custo'),
  (42.5, '2.3', 'Equipamentos e Materiais - Postos', 'CSV - Custo Serviço Vendido', 'custo'),
  (68.5, '2.4', 'Monitoramento e Segurança - Postos', 'CSV - Custo Serviço Vendido', 'custo'),
  (71.5, '2.5', 'Processos Trabalhistas - Postos', 'CSV - Custo Serviço Vendido', 'custo'),
  (72.5, '2.7', 'Insumos e Comissões - Postos', 'CSV - Custo Serviço Vendido', 'custo'),
  (74.5, '2.8', 'Sistemas e Telefonia - Postos', 'CSV - Custo Serviço Vendido', 'custo'),
  (81.5, '3.8', 'Despesas Comerciais', 'Despesas Operacionais Comercial', 'despesa'),
  (87.5, '3.9', 'Veículos - Comercial', 'Despesas Operacionais Comercial', 'despesa'),
  (94.5, '3.10', 'Insumos e Comissões - Comercial', 'Despesas Operacionais Comercial', 'despesa')
) AS v(ordem, codigo, nome, grupo, natureza)
WHERE NOT EXISTS (
  SELECT 1 FROM categorias_dre WHERE codigo = v.codigo
);
/*
  # Atualizar valores de status dos chamados

  1. Alterações na tabela ti_chamados
    - Atualizar constraint de status para aceitar novos valores: A fazer, Fazendo, Feito
    - Migrar dados existentes para os novos valores

  2. Mapeamento de status antigos para novos:
    - Aberto -> A fazer
    - Em Andamento -> Fazendo
    - Aguardando -> A fazer
    - Concluído -> Feito
    - Cancelado -> A fazer
*/

-- Primeiro, remover o constraint antigo
ALTER TABLE ti_chamados DROP CONSTRAINT IF EXISTS ti_chamados_status_check;

-- Atualizar registros existentes para os novos valores
UPDATE ti_chamados SET status = 'A fazer' WHERE status IN ('Aberto', 'Aguardando', 'Cancelado');
UPDATE ti_chamados SET status = 'Fazendo' WHERE status = 'Em Andamento';
UPDATE ti_chamados SET status = 'Feito' WHERE status = 'Concluído';

-- Adicionar novo constraint com os novos valores
ALTER TABLE ti_chamados
  ADD CONSTRAINT ti_chamados_status_check
  CHECK (status IN ('A fazer', 'Fazendo', 'Feito'));

-- Atualizar o valor default
ALTER TABLE ti_chamados ALTER COLUMN status SET DEFAULT 'A fazer';

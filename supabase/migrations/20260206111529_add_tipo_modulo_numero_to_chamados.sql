/*
  # Adicionar campos tipo, módulo e número sequencial aos chamados

  1. Alterações na tabela ti_chamados
    - Adicionar coluna `chamado_numero` (integer) - Número sequencial do chamado
    - Adicionar coluna `tipo` (text) - Estrutural, Melhoria ou Correção
    - Adicionar coluna `modulo` (text) - Módulo relacionado ao chamado
    - Criar sequence para gerar números automáticos
    - Criar trigger para auto-incrementar o número do chamado

  2. Dados
    - Atualizar registros existentes com números sequenciais
*/

-- Criar sequence para números de chamados
CREATE SEQUENCE IF NOT EXISTS ti_chamados_numero_seq START WITH 1;

-- Adicionar colunas
ALTER TABLE ti_chamados
  ADD COLUMN IF NOT EXISTS chamado_numero integer UNIQUE,
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'Correção' CHECK (tipo IN ('Estrutural', 'Melhoria', 'Correção')),
  ADD COLUMN IF NOT EXISTS modulo text NOT NULL DEFAULT 'Geral';

-- Atualizar registros existentes com números sequenciais
DO $$
DECLARE
  rec RECORD;
  num integer := 1;
BEGIN
  FOR rec IN
    SELECT id FROM ti_chamados
    WHERE chamado_numero IS NULL
    ORDER BY data_abertura ASC
  LOOP
    UPDATE ti_chamados
    SET chamado_numero = num
    WHERE id = rec.id;
    num := num + 1;
  END LOOP;

  -- Ajustar sequence para o próximo número
  PERFORM setval('ti_chamados_numero_seq', num);
END $$;

-- Tornar campo obrigatório após preencher os existentes
ALTER TABLE ti_chamados ALTER COLUMN chamado_numero SET NOT NULL;

-- Criar função para auto-incrementar número do chamado
CREATE OR REPLACE FUNCTION set_chamado_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.chamado_numero IS NULL THEN
    NEW.chamado_numero := nextval('ti_chamados_numero_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para auto-incrementar
DROP TRIGGER IF EXISTS trigger_set_chamado_numero ON ti_chamados;
CREATE TRIGGER trigger_set_chamado_numero
  BEFORE INSERT ON ti_chamados
  FOR EACH ROW
  EXECUTE FUNCTION set_chamado_numero();

-- Criar índice para busca rápida por número
CREATE INDEX IF NOT EXISTS idx_ti_chamados_numero ON ti_chamados(chamado_numero);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_tipo ON ti_chamados(tipo);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_modulo ON ti_chamados(modulo);

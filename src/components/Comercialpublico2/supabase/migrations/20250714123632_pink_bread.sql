/*
  # Atualizar estrutura da tabela weekly_performance

  1. Alterações na tabela
    - Remover campos desnecessários para Closers: tarefas
    - Remover campos desnecessários para SDRs: tarefas
    - Manter apenas os campos solicitados
    - Atualizar função de cálculo de pontos

  2. Campos mantidos
    - Para Closers: propostas_apresentadas, conexoes_totais, contrato_assinado
    - Para SDRs: contatos_ativados, mql, visitas_agendadas, conexoes_totais

  3. Pontuação atualizada
    - Closers: propostas_apresentadas (x30), conexoes_totais (x1), contrato_assinado (x50)
    - SDRs: contatos_ativados (x1), mql (x5), visitas_agendadas (x10), conexoes_totais (x1)
*/

-- Remover campos desnecessários da tabela weekly_performance
ALTER TABLE weekly_performance 
DROP COLUMN IF EXISTS tarefas,
DROP COLUMN IF EXISTS conexoes;

-- Renomear conexoes_totais para conexoes_totais se necessário (já existe)
-- Manter: propostas_apresentadas, contrato_assinado, contatos_ativados, mql, visitas_agendadas, conexoes_totais

-- Atualizar a função de cálculo de pontos
CREATE OR REPLACE FUNCTION calculate_weekly_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular pontos baseado nos novos multiplicadores
  NEW.total_points := 
    COALESCE(NEW.propostas_apresentadas, 0) * 30 +  -- Closers: x30
    COALESCE(NEW.conexoes_totais, 0) * 1 +          -- Ambos: x1
    COALESCE(NEW.contrato_assinado, 0) * 50 +       -- Closers: x50
    COALESCE(NEW.contatos_ativados, 0) * 1 +        -- SDRs: x1
    COALESCE(NEW.mql, 0) * 5 +                      -- SDRs: x5
    COALESCE(NEW.visitas_agendadas, 0) * 10;        -- SDRs: x10

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS calculate_weekly_points_trigger ON weekly_performance;
CREATE TRIGGER calculate_weekly_points_trigger
  BEFORE INSERT OR UPDATE ON weekly_performance
  FOR EACH ROW EXECUTE FUNCTION calculate_weekly_points();

-- Recalcular pontos para registros existentes
UPDATE weekly_performance SET 
  total_points = 
    COALESCE(propostas_apresentadas, 0) * 30 +
    COALESCE(conexoes_totais, 0) * 1 +
    COALESCE(contrato_assinado, 0) * 50 +
    COALESCE(contatos_ativados, 0) * 1 +
    COALESCE(mql, 0) * 5 +
    COALESCE(visitas_agendadas, 0) * 10;
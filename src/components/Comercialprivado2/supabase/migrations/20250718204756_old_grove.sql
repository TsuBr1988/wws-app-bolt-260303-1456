/*
  # Atualizar sistema de pontuação semanal

  1. Remover colunas desnecessárias
    - Remove `conexoes_totais` (não é mais usada)
    - Remove `contatos_ativados` (não é mais usada para SDRs)

  2. Atualizar função de cálculo de pontos
    - Modifica `calculate_weekly_points()` para usar peso 1 para todas as métricas
    - Closers: total = propostas_apresentadas + contrato_assinado
    - SDRs: total = mql + visitas_agendadas

  3. Recalcular pontos existentes
    - Aplica novas regras a todos os registros existentes
    - Garante consistência entre frontend e backend
*/

-- 1. Remover colunas que não são mais necessárias
DO $$
BEGIN
  -- Remover coluna conexoes_totais se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weekly_performance' AND column_name = 'conexoes_totais'
  ) THEN
    ALTER TABLE weekly_performance DROP COLUMN conexoes_totais;
  END IF;

  -- Remover coluna contatos_ativados se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weekly_performance' AND column_name = 'contatos_ativados'
  ) THEN
    ALTER TABLE weekly_performance DROP COLUMN contatos_ativados;
  END IF;
END $$;

-- 2. Recriar a função de cálculo de pontos com as novas regras
CREATE OR REPLACE FUNCTION calculate_weekly_points()
RETURNS TRIGGER AS $$
DECLARE
  employee_role text;
  calculated_points integer := 0;
BEGIN
  -- Buscar a função do funcionário
  SELECT role INTO employee_role
  FROM employees
  WHERE id = NEW.employee_id;

  -- Calcular pontos baseado na função (peso 1 para todas as métricas)
  IF employee_role = 'Closer' THEN
    -- Closers: propostas_apresentadas + contrato_assinado
    calculated_points := COALESCE(NEW.propostas_apresentadas, 0) + COALESCE(NEW.contrato_assinado, 0);
  ELSIF employee_role = 'SDR' THEN
    -- SDRs: mql + visitas_agendadas
    calculated_points := COALESCE(NEW.mql, 0) + COALESCE(NEW.visitas_agendadas, 0);
  ELSE
    -- Outras funções: 0 pontos
    calculated_points := 0;
  END IF;

  -- Definir o total_points calculado
  NEW.total_points := calculated_points;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar o trigger para garantir que funcione com a nova função
DROP TRIGGER IF EXISTS calculate_weekly_points_trigger ON weekly_performance;
CREATE TRIGGER calculate_weekly_points_trigger
  BEFORE INSERT OR UPDATE ON weekly_performance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_weekly_points();

-- 4. Recalcular todos os pontos existentes com as novas regras
UPDATE weekly_performance 
SET total_points = (
  CASE 
    WHEN (SELECT role FROM employees WHERE id = weekly_performance.employee_id) = 'Closer' THEN
      COALESCE(propostas_apresentadas, 0) + COALESCE(contrato_assinado, 0)
    WHEN (SELECT role FROM employees WHERE id = weekly_performance.employee_id) = 'SDR' THEN
      COALESCE(mql, 0) + COALESCE(visitas_agendadas, 0)
    ELSE
      0
  END
);

-- 5. Adicionar comentários nas colunas para documentar o novo sistema
COMMENT ON COLUMN weekly_performance.propostas_apresentadas IS 'Propostas apresentadas pelo Closer (peso 1)';
COMMENT ON COLUMN weekly_performance.contrato_assinado IS 'Contratos assinados pelo Closer (peso 1)';
COMMENT ON COLUMN weekly_performance.mql IS 'MQLs gerados pelo SDR (peso 1)';
COMMENT ON COLUMN weekly_performance.visitas_agendadas IS 'Visitas agendadas pelo SDR (peso 1)';
COMMENT ON COLUMN weekly_performance.total_points IS 'Pontuação total calculada automaticamente: Closer = propostas + contratos, SDR = mql + visitas';
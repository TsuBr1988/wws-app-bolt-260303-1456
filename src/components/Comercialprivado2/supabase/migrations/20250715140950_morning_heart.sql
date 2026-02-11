-- Corrigir constraint UNIQUE para weekly_performance
-- Problema: ON CONFLICT precisa de uma constraint UNIQUE correspondente

-- 1. Remover constraint existente se houver conflito
DROP INDEX IF EXISTS weekly_performance_employee_week_unique;

-- 2. Criar constraint UNIQUE correta para employee_id + week_ending_date
ALTER TABLE public.weekly_performance
  DROP CONSTRAINT IF EXISTS weekly_performance_employee_week_unique;

ALTER TABLE public.weekly_performance
  ADD CONSTRAINT weekly_performance_employee_week_unique
  UNIQUE (employee_id, week_ending_date);

-- 3. Criar índice adicional para performance
CREATE INDEX IF NOT EXISTS weekly_performance_week_date_idx
  ON public.weekly_performance (week_ending_date);

CREATE INDEX IF NOT EXISTS weekly_performance_employee_idx
  ON public.weekly_performance (employee_id);
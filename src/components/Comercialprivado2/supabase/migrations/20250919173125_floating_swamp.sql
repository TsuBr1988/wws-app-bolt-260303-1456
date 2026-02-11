/*
  # Tabela de métricas diárias do REEV

  1. Nova tabela reev_daily_metrics
    - Chave primária composta: (day, reev_user_id)
    - Métricas de tarefas por canal (email, linkedin, phone, whatsapp, meeting)
    - Métricas de conexões por canal (preparado para futuro)
    - Timestamps para auditoria

  2. Índices de performance
    - Índice por dia para consultas por período
    - Índice por reev_user_id para consultas por usuário

  3. Estrutura idempotente
    - CREATE TABLE IF NOT EXISTS
    - ADD COLUMN IF NOT EXISTS para atualizações futuras
*/

-- Tabela principal de métricas diárias do REEV
CREATE TABLE IF NOT EXISTS public.reev_daily_metrics (
  day date NOT NULL,
  reev_user_id text NOT NULL,
  user_name text NOT NULL DEFAULT '',
  
  -- Tarefas disparadas por canal
  tasks_email integer NOT NULL DEFAULT 0,
  tasks_linkedin integer NOT NULL DEFAULT 0,
  tasks_phone integer NOT NULL DEFAULT 0,
  tasks_whatsapp integer NOT NULL DEFAULT 0,
  tasks_meeting integer NOT NULL DEFAULT 0,
  
  -- Conexões efetivas por canal (preparado para implementação futura)
  connections_email integer NOT NULL DEFAULT 0,
  connections_linkedin integer NOT NULL DEFAULT 0,
  connections_phone integer NOT NULL DEFAULT 0,
  connections_whatsapp integer NOT NULL DEFAULT 0,
  connections_meeting integer NOT NULL DEFAULT 0,
  
  -- Auditoria
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  
  -- Chave primária composta
  CONSTRAINT reev_daily_metrics_pk PRIMARY KEY (day, reev_user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS reev_daily_metrics_day_idx ON public.reev_daily_metrics (day);
CREATE INDEX IF NOT EXISTS reev_daily_metrics_user_idx ON public.reev_daily_metrics (reev_user_id);
CREATE INDEX IF NOT EXISTS reev_daily_metrics_day_user_idx ON public.reev_daily_metrics (day, reev_user_id);

-- Garantias idempotentes para atualizações futuras
DO $$
BEGIN
  -- Adicionar colunas se não existirem (para migrations futuras)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reev_daily_metrics' AND column_name = 'tasks_email') THEN
    ALTER TABLE public.reev_daily_metrics 
    ADD COLUMN tasks_email integer NOT NULL DEFAULT 0,
    ADD COLUMN tasks_linkedin integer NOT NULL DEFAULT 0,
    ADD COLUMN tasks_phone integer NOT NULL DEFAULT 0,
    ADD COLUMN tasks_whatsapp integer NOT NULL DEFAULT 0,
    ADD COLUMN tasks_meeting integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reev_daily_metrics' AND column_name = 'connections_email') THEN
    ALTER TABLE public.reev_daily_metrics 
    ADD COLUMN connections_email integer NOT NULL DEFAULT 0,
    ADD COLUMN connections_linkedin integer NOT NULL DEFAULT 0,
    ADD COLUMN connections_phone integer NOT NULL DEFAULT 0,
    ADD COLUMN connections_whatsapp integer NOT NULL DEFAULT 0,
    ADD COLUMN connections_meeting integer NOT NULL DEFAULT 0;
  END IF;
END $$;
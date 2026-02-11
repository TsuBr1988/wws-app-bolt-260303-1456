/*
  # Adicionar funções de vigilância com gratificações padrão

  1. Mudanças na Tabela config_functions
    - Adicionar coluna `default_bonus_percent` (numeric) - Gratificação padrão em %
  
  2. Atualizar Funções Existentes
    - Atualizar funções de vigilância existentes com gratificações corretas
  
  3. Inserir Novas Funções de Vigilância
    - Funções básicas com gratificações (10%, 12%)
    - Funções de monitoramento eletrônico (5%, 11.77%, 74.71%)
    - Funções administrativas (sem gratificação)
*/

-- Adicionar coluna default_bonus_percent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'config_functions' AND column_name = 'default_bonus_percent'
  ) THEN
    ALTER TABLE config_functions ADD COLUMN default_bonus_percent numeric(5,2) DEFAULT 0;
  END IF;
END $$;

-- Atualizar funções de vigilância existentes com gratificações
UPDATE config_functions SET default_bonus_percent = 0 WHERE code = 'VIGILANTE' AND service_type = 'vigilancia';
UPDATE config_functions SET default_bonus_percent = 10 WHERE code = 'VIGILANTE_CONDUTOR_ANIMAIS' AND service_type = 'vigilancia';
UPDATE config_functions SET default_bonus_percent = 10 WHERE code = 'VIGILANTE_CONDUTOR_VEICULOS' AND service_type = 'vigilancia';
UPDATE config_functions SET default_bonus_percent = 10 WHERE code = 'VIGILANTE_SEGURANCA_PESSOAL' AND service_type = 'vigilancia';
UPDATE config_functions SET default_bonus_percent = 10 WHERE code = 'VIGILANTE_BALANCEIRO' AND service_type = 'vigilancia';
UPDATE config_functions SET default_bonus_percent = 10 WHERE code = 'VIGILANTE_BRIGADISTA' AND service_type = 'vigilancia';
UPDATE config_functions SET default_bonus_percent = 12 WHERE code = 'VIGILANTE_LIDER' AND service_type = 'vigilancia';

-- Inserir novas funções de monitoramento eletrônico
INSERT INTO config_functions (code, name, base_salary, service_type, default_bonus_percent, is_active) VALUES
  ('VIGILANTE_MONITOR_SEG_ELETRONICA', 'I- Vigilante / Monitor de Segurança Eletrônica', 2271.74, 'vigilancia', 5, true),
  ('VIGILANTE_OPERADOR_MONIT_ELETRONICO', 'II- Vigilante Operador de Monit. Eletrônico', 2271.74, 'vigilancia', 11.77, true),
  ('SUPERVISOR_MONITORAMENTO_ELETRONICO', 'III- Supervisor de Monitoramento Eletrônico', 2271.74, 'vigilancia', 74.71, true),
  ('VIGILANTE_OPERADOR_DRONE_VANT', 'IV - Vigilante Operador de Drone ou VANT', 2271.74, 'vigilancia', 11.77, true)
ON CONFLICT (code) DO UPDATE SET
  default_bonus_percent = EXCLUDED.default_bonus_percent,
  base_salary = EXCLUDED.base_salary;

-- Inserir funções administrativas de segurança
INSERT INTO config_functions (code, name, base_salary, service_type, default_bonus_percent, is_active) VALUES
  ('EMPREGADOS_ADMINISTRATIVOS', 'I- Empregados Administrativos', 1703.91, 'vigilancia', 0, true),
  ('INSPETOR_SEGURANCA', 'II- Inspetor de Segurança', 3287.45, 'vigilancia', 0, true),
  ('SUPERVISOR_SEGURANCA', 'III- Supervisor de Segurança', 3969.05, 'vigilancia', 0, true),
  ('COORDENADOR_OPERACIONAL_SEGURANCA', 'IV-Coordenador Operacional de Segurança', 4762.90, 'vigilancia', 0, true),
  ('ATENDENTE_SINISTRO', 'V- Atendente de Sinistro', 2498.88, 'vigilancia', 0, true),
  ('INSTALADOR_SISTEMAS_ELETRONICOS', 'VI- Instalador de Sistemas Eletrônicos', 2176.50, 'vigilancia', 0, true),
  ('AUXILIAR_MONITORAMENTO_ELETRONICO', 'VII- Auxiliar de Monitoramento Eletrônico', 1874.39, 'vigilancia', 0, true)
ON CONFLICT (code) DO UPDATE SET
  default_bonus_percent = EXCLUDED.default_bonus_percent,
  base_salary = EXCLUDED.base_salary;
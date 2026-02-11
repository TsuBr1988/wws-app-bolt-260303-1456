/*
  # Adicionar suporte para tipos de serviço (Facilities e Vigilância)

  1. Mudanças nas Tabelas
    - Adicionar coluna `service_type` na tabela `budgets`
      - Valores: 'facilities' ou 'vigilancia'
      - Default: 'facilities' (compatibilidade com dados existentes)
    - Adicionar coluna `service_type` na tabela `config_functions`
      - Categoriza funções por tipo de serviço
    - Adicionar coluna `service_type` na tabela `config_benefits`
      - Categoriza benefícios por tipo de serviço

  2. Dados Iniciais - Funções de Vigilância
    - Inserir 7 funções de vigilância com salário base R$ 2.271,74
    - Marcar todas com service_type 'vigilancia'

  3. Dados Iniciais - Benefícios de Vigilância
    - Vale Refeição: R$ 34,44/dia
    - Cesta Básica: R$ 198,03/mês
    - PPR: R$ 47,33/mês
    - Curso de Reciclagem: R$ 66,67/mês
    - Assistência Médica: R$ 198,03/mês
    - Seguro de Vida: R$ 26,13/mês
    - Auxílio Morte/Funeral: R$ 3,65/mês
    - NR 07: R$ 13,00/mês

  4. Índices
    - Criar índices nas colunas service_type para otimizar consultas

  5. Migração de Dados
    - Atualizar registros existentes com service_type 'facilities'
*/

-- Adicionar coluna service_type na tabela budgets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE budgets ADD COLUMN service_type text NOT NULL DEFAULT 'facilities';
    ALTER TABLE budgets ADD CONSTRAINT budgets_service_type_check 
      CHECK (service_type IN ('facilities', 'vigilancia'));
  END IF;
END $$;

-- Adicionar coluna service_type na tabela config_functions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'config_functions' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE config_functions ADD COLUMN service_type text NOT NULL DEFAULT 'facilities';
    ALTER TABLE config_functions ADD CONSTRAINT config_functions_service_type_check 
      CHECK (service_type IN ('facilities', 'vigilancia'));
  END IF;
END $$;

-- Adicionar coluna service_type na tabela config_benefits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'config_benefits' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE config_benefits ADD COLUMN service_type text NOT NULL DEFAULT 'facilities';
    ALTER TABLE config_benefits ADD CONSTRAINT config_benefits_service_type_check 
      CHECK (service_type IN ('facilities', 'vigilancia'));
  END IF;
END $$;

-- Criar índices para otimizar consultas por service_type
CREATE INDEX IF NOT EXISTS idx_budgets_service_type ON budgets(service_type);
CREATE INDEX IF NOT EXISTS idx_config_functions_service_type ON config_functions(service_type);
CREATE INDEX IF NOT EXISTS idx_config_benefits_service_type ON config_benefits(service_type);

-- Atualizar funções existentes para facilities
UPDATE config_functions SET service_type = 'facilities' WHERE service_type IS NULL OR service_type = 'facilities';

-- Atualizar benefícios existentes para facilities
UPDATE config_benefits SET service_type = 'facilities' WHERE service_type IS NULL OR service_type = 'facilities';

-- Inserir funções de vigilância
INSERT INTO config_functions (code, name, base_salary, is_active, service_type) VALUES
  ('VIGILANTE', 'I- Vigilante', 2271.74, true, 'vigilancia'),
  ('VIGILANTE_CONDUTOR_ANIMAIS', 'II- Vigilante Condutor de Animais', 2271.74, true, 'vigilancia'),
  ('VIGILANTE_CONDUTOR_VEICULOS', 'III- Vigilante/Condutor de Veículos Motorizados', 2271.74, true, 'vigilancia'),
  ('VIGILANTE_SEGURANCA_PESSOAL', 'IV- Vigilante/Segurança Pessoal', 2271.74, true, 'vigilancia'),
  ('VIGILANTE_BALANCEIRO', 'V- Vigilante Balanceiro', 2271.74, true, 'vigilancia'),
  ('VIGILANTE_BRIGADISTA', 'VI- Vigilante/Brigadista', 2271.74, true, 'vigilancia'),
  ('VIGILANTE_LIDER', 'VII- Vigilante /Líder', 2271.74, true, 'vigilancia')
ON CONFLICT (code) DO NOTHING;

-- Inserir benefícios de vigilância
INSERT INTO config_benefits (code, name, base_value, calculation_type, is_active, service_type, order_index) VALUES
  ('VR_VIGILANCIA', 'Vale Refeição', 34.44, 'per_day', true, 'vigilancia', 1),
  ('CESTA_BASICA_VIGILANCIA', 'Cesta Básica', 198.03, 'per_month', true, 'vigilancia', 2),
  ('PPR_VIGILANCIA', 'PPR', 47.33, 'per_month', true, 'vigilancia', 3),
  ('CURSO_RECICLAGEM', 'Curso de Reciclagem', 66.67, 'per_month', true, 'vigilancia', 4),
  ('ASSISTENCIA_MEDICA', 'Assistência Médica e Hospitalar', 198.03, 'per_month', true, 'vigilancia', 5),
  ('SEGURO_VIDA_VIGILANCIA', 'Seguro de Vida', 26.13, 'per_month', true, 'vigilancia', 6),
  ('AUXILIO_MORTE_FUNERAL', 'Auxílio Morte/Funeral', 3.65, 'per_month', true, 'vigilancia', 7),
  ('NR_07', 'NR 07', 13.00, 'per_month', true, 'vigilancia', 8)
ON CONFLICT (code) DO NOTHING;
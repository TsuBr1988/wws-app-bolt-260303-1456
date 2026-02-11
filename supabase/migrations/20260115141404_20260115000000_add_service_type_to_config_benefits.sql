/*
  # Adicionar Service Type ao Sistema de Benefícios

  ## Descrição
  Esta migration adiciona suporte para diferentes tipos de serviço (Limpeza e Vigilância)
  no sistema de benefícios, permitindo que cada benefício tenha valores e fórmulas
  específicas por tipo de serviço.

  ## Mudanças

  1. Nova Tabela `config_benefits`
    - Cria tabela de configuração de benefícios
    - Inclui campo `service_type` ('limpeza' ou 'vigilancia')
    - Suporta cálculos com fórmulas usando variáveis

  2. Campos da tabela
    - `id` (uuid, primary key)
    - `code` (text) - Código do benefício (ex: VT, VA, VR)
    - `name` (text) - Nome descritivo do benefício
    - `calculation_type` (text) - Tipo de cálculo: 'fixed', 'per_day', 'per_month', 'formula'
    - `base_value` (numeric) - Valor base quando não usa fórmula
    - `formula` (text) - Fórmula de cálculo (opcional, usa variáveis)
    - `service_type` (text) - Tipo de serviço: 'limpeza' ou 'vigilancia'
    - `is_active` (boolean) - Se o benefício está ativo
    - `order_index` (integer) - Ordem de exibição na UI
    - `created_at`, `updated_at` (timestamptz)

  3. Variáveis disponíveis nas fórmulas
    - `vtU` - Valor unitário do Vale Transporte
    - `diasU` - Dias úteis trabalhados por mês (baseado na escala)
    - `q` - Quantidade de funcionários da função
    - `salario` - Salário base do funcionário
    - `horasDia` - Horas trabalhadas por dia

  4. Dados Iniciais
    - Benefícios padrão para Limpeza
    - Benefícios padrão para Vigilância
    - Vigilância tem benefícios adicionais (bonificação, adicional noturno)

  5. Segurança
    - RLS habilitado
    - Políticas permissivas para public

  6. Índices
    - Índice composto (service_type, code) para queries eficientes
    - Índices em is_active e order_index
*/

-- Criar tabela config_benefits se não existir
CREATE TABLE IF NOT EXISTS config_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  calculation_type text NOT NULL DEFAULT 'fixed' CHECK (calculation_type IN ('fixed', 'per_day', 'per_month', 'formula')),
  base_value numeric(10,2) DEFAULT 0,
  formula text DEFAULT '',
  service_type text NOT NULL DEFAULT 'limpeza' CHECK (service_type IN ('limpeza', 'vigilancia')),
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_type, code)
);

-- Habilitar RLS
ALTER TABLE config_benefits ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (sem autenticação por enquanto)
CREATE POLICY "Allow all operations on config_benefits"
  ON config_benefits
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_config_benefits_service_type_code
  ON config_benefits(service_type, code);
CREATE INDEX IF NOT EXISTS idx_config_benefits_service_type
  ON config_benefits(service_type);
CREATE INDEX IF NOT EXISTS idx_config_benefits_is_active
  ON config_benefits(is_active);
CREATE INDEX IF NOT EXISTS idx_config_benefits_order_index
  ON config_benefits(order_index);

-- Inserir benefícios padrão para LIMPEZA
INSERT INTO config_benefits (code, name, calculation_type, base_value, formula, service_type, is_active, order_index) VALUES
  ('VT', 'Vale Transporte', 'formula', 0, 'vtU * 2 * diasU * q', 'limpeza', true, 1),
  ('VA', 'Vale Alimentação', 'per_day', 25.00, '', 'limpeza', true, 2),
  ('PLANO_SAUDE', 'Plano de Saúde', 'per_month', 150.00, '', 'limpeza', true, 3),
  ('PLANO_ODONTO', 'Plano Odontológico', 'per_month', 50.00, '', 'limpeza', true, 4),
  ('SEGURO_VIDA', 'Seguro de Vida', 'per_month', 20.00, '', 'limpeza', true, 5),
  ('CESTA_BASICA', 'Cesta Básica', 'per_month', 80.00, '', 'limpeza', true, 6)
ON CONFLICT (service_type, code) DO NOTHING;

-- Inserir benefícios padrão para VIGILÂNCIA
INSERT INTO config_benefits (code, name, calculation_type, base_value, formula, service_type, is_active, order_index) VALUES
  ('VT', 'Vale Transporte', 'formula', 0, 'vtU * 2 * diasU * q', 'vigilancia', true, 1),
  ('VA', 'Vale Alimentação', 'per_day', 30.00, '', 'vigilancia', true, 2),
  ('VR', 'Vale Refeição', 'per_day', 35.00, '', 'vigilancia', true, 3),
  ('PLANO_SAUDE', 'Plano de Saúde', 'per_month', 180.00, '', 'vigilancia', true, 4),
  ('PLANO_ODONTO', 'Plano Odontológico', 'per_month', 60.00, '', 'vigilancia', true, 5),
  ('SEGURO_VIDA', 'Seguro de Vida', 'per_month', 25.00, '', 'vigilancia', true, 6),
  ('BONUS', 'Bonificação', 'formula', 0, 'salario * 0.15 * q', 'vigilancia', true, 7),
  ('ADICIONAL_NOTURNO', 'Adicional Noturno', 'formula', 0, 'salario * 0.20 * q', 'vigilancia', true, 8),
  ('PERICULOSIDADE', 'Periculosidade', 'formula', 0, 'salario * 0.30 * q', 'vigilancia', true, 9)
ON CONFLICT (service_type, code) DO NOTHING;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_config_benefits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_config_benefits_updated_at
  BEFORE UPDATE ON config_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_config_benefits_updated_at();
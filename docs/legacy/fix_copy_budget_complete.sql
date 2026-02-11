/*
  # Correção Completa da Função copy_budget_as_new

  Este script:
  1. Adiciona todas as colunas faltantes nas tabelas
  2. Recria a função copy_budget_as_new com a estrutura correta
*/

-- ========================================
-- 1. ADICIONAR COLUNAS FALTANTES
-- ========================================

-- Adicionar colunas na tabela budgets
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS margem_lucro NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS margem_adm NUMERIC(5,2) DEFAULT 0;

-- Não adicionar colunas na budget_calculations pois só tem:
-- id, budget_id, function_data (jsonb), total_bdi, total_contract, created_at, updated_at

-- ========================================
-- 2. GARANTIR FUNÇÃO get_next_budget_number
-- ========================================

CREATE OR REPLACE FUNCTION get_next_budget_number(p_year integer)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_sequence integer;
  v_budget_number text;
BEGIN
  SELECT COALESCE(MAX(sequence_number), 0) + 1
  INTO v_sequence
  FROM budgets
  WHERE year = p_year;

  v_budget_number := p_year || '-' || LPAD(v_sequence::text, 3, '0');
  RETURN v_budget_number;
END;
$$;

-- ========================================
-- 3. DROPAR VERSÕES ANTIGAS DA FUNÇÃO
-- ========================================

DROP FUNCTION IF EXISTS copy_budget_as_new(uuid);
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid, text);
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid, text, text);
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid, text, text, text);
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid, text, text, text, text, text);
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid, text, text, text, text, text, text, text, text);

-- ========================================
-- 4. CRIAR FUNÇÃO CORRIGIDA
-- ========================================

CREATE FUNCTION copy_budget_as_new(
  p_original_budget_id uuid,
  p_new_client_name text DEFAULT NULL,
  p_new_description text DEFAULT NULL,
  p_new_city_name text DEFAULT NULL,
  p_new_cnpj text DEFAULT NULL,
  p_new_email text DEFAULT NULL,
  p_new_phone text DEFAULT NULL,
  p_new_address text DEFAULT NULL,
  p_new_lead_source text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_budget_id uuid;
  v_original_budget RECORD;
  v_function_record RECORD;
  v_new_budget_number text;
  v_current_year integer;
  v_new_sequence integer;
BEGIN
  -- Buscar orçamento original
  SELECT * INTO v_original_budget
  FROM budgets
  WHERE id = p_original_budget_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento com ID % não encontrado', p_original_budget_id;
  END IF;

  -- Gerar novo número de orçamento
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  v_new_budget_number := get_next_budget_number(v_current_year);
  v_new_sequence := (SELECT COALESCE(MAX(sequence_number), 0) + 1 FROM budgets WHERE year = v_current_year);

  -- Criar novo orçamento com TODAS as colunas que existem
  INSERT INTO budgets (
    budget_number,
    sequence_number,
    client_name,
    description,
    name,
    vt_value,
    iss_rate,
    city,
    service_type,
    status,
    year,
    contact_name,
    contact_email,
    contact_phone,
    margem_lucro,
    margem_adm,
    city_name,
    cnpj,
    email,
    phone,
    address,
    lead_source,
    client,
    project_name,
    total_value
  ) VALUES (
    v_new_budget_number,
    v_new_sequence,
    COALESCE(p_new_client_name, v_original_budget.client_name),
    COALESCE(p_new_description, v_original_budget.description),
    v_original_budget.name,
    v_original_budget.vt_value,
    v_original_budget.iss_rate,
    v_original_budget.city,
    v_original_budget.service_type,
    'open',
    v_current_year,
    v_original_budget.contact_name,
    v_original_budget.contact_email,
    v_original_budget.contact_phone,
    v_original_budget.margem_lucro,
    v_original_budget.margem_adm,
    COALESCE(p_new_city_name, v_original_budget.city_name),
    COALESCE(p_new_cnpj, v_original_budget.cnpj),
    COALESCE(p_new_email, v_original_budget.email),
    COALESCE(p_new_phone, v_original_budget.phone),
    COALESCE(p_new_address, v_original_budget.address),
    COALESCE(p_new_lead_source, v_original_budget.lead_source),
    v_original_budget.client,
    v_original_budget.project_name,
    v_original_budget.total_value
  )
  RETURNING id INTO v_new_budget_id;

  -- Copiar funções do orçamento
  FOR v_function_record IN
    SELECT * FROM budget_functions WHERE budget_id = p_original_budget_id
  LOOP
    INSERT INTO budget_functions (
      budget_id,
      function_name,
      quantity,
      salary,
      scale,
      shift_type,
      periculosity_percent,
      unhealthiness_percent,
      bonus_percent,
      night_additional_percent,
      hours_per_day,
      reduced_hour_percent,
      has_intrajornada,
      intrajornada_percent,
      vt_value,
      city,
      iss_rate
    ) VALUES (
      v_new_budget_id,
      v_function_record.function_name,
      v_function_record.quantity,
      v_function_record.salary,
      v_function_record.scale,
      v_function_record.shift_type,
      v_function_record.periculosity_percent,
      v_function_record.unhealthiness_percent,
      v_function_record.bonus_percent,
      v_function_record.night_additional_percent,
      v_function_record.hours_per_day,
      v_function_record.reduced_hour_percent,
      v_function_record.has_intrajornada,
      v_function_record.intrajornada_percent,
      v_function_record.vt_value,
      v_function_record.city,
      v_function_record.iss_rate
    );
  END LOOP;

  -- Copiar materiais (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_materials') THEN
    INSERT INTO budget_materials (budget_id, material_id, quantity, unit_value, amortization_months, allocated_functions)
    SELECT v_new_budget_id, material_id, quantity, unit_value, amortization_months, allocated_functions
    FROM budget_materials WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar equipamentos (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_equipments') THEN
    INSERT INTO budget_equipments (budget_id, equipment_id, quantity, unit_value, amortization_months, allocated_functions)
    SELECT v_new_budget_id, equipment_id, quantity, unit_value, amortization_months, allocated_functions
    FROM budget_equipments WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar uniformes (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_uniforms') THEN
    INSERT INTO budget_uniforms (budget_id, uniform_id, quantity, unit_value, amortization_months, function_id)
    SELECT v_new_budget_id, uniform_id, quantity, unit_value, amortization_months, function_id
    FROM budget_uniforms WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar CAPEX (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_capex') THEN
    INSERT INTO budget_capex (budget_id, capex_id, quantity, unit_value, amortization_months)
    SELECT v_new_budget_id, capex_id, quantity, unit_value, amortization_months
    FROM budget_capex WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar outros (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_others') THEN
    INSERT INTO budget_others (budget_id, description, quantity, unit_value, amortization_months)
    SELECT v_new_budget_id, description, quantity, unit_value, amortization_months
    FROM budget_others WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar benefícios diferenciados (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_differentiated_benefits') THEN
    INSERT INTO budget_differentiated_benefits (budget_id, function_id, benefit_name, value_per_employee)
    SELECT v_new_budget_id, function_id, benefit_name, value_per_employee
    FROM budget_differentiated_benefits WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar overrides de benefícios por função (se existir)
  -- Nota: budget_id é TEXT nesta tabela
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_function_benefit_overrides') THEN
    INSERT INTO budget_function_benefit_overrides (budget_id, function_id, benefit_code, custom_value, custom_formula, notes)
    SELECT v_new_budget_id::text, function_id, benefit_code, custom_value, custom_formula, notes
    FROM budget_function_benefit_overrides WHERE budget_id = p_original_budget_id::text;
  END IF;

  -- Copiar overrides de encargos (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_encargos_overrides') THEN
    INSERT INTO budget_encargos_overrides (budget_id, grupo_code, encargo_code, encargo_name, custom_rate, notes)
    SELECT v_new_budget_id, grupo_code, encargo_code, encargo_name, custom_rate, notes
    FROM budget_encargos_overrides WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar cálculos (se existir)
  -- Nota: budget_calculations só tem: id, budget_id, function_data (jsonb), total_bdi, total_contract
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_calculations') THEN
    INSERT INTO budget_calculations (budget_id, function_data, total_bdi, total_contract)
    SELECT v_new_budget_id, function_data, total_bdi, total_contract
    FROM budget_calculations WHERE budget_id = p_original_budget_id;
  END IF;

  RETURN v_new_budget_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao copiar orçamento: %', SQLERRM;
END;
$$;

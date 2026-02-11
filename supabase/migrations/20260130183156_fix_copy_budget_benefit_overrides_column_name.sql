/*
  # Fix copy_budget_as_new function to use correct column names
  
  ## Problem
  The function is trying to use "override_value" but the column is actually named "custom_value"
  in budget_function_benefit_overrides table.
  
  ## Solution
  Recreate the copy_budget_as_new function with correct column names:
  - Use "custom_value" instead of "override_value"
  - Use "custom_formula" if applicable
  - Copy budget_function_benefit_overrides if the table exists
  - Copy budget_encargos_overrides if the table exists
*/

-- Drop existing function
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid, text, text, text, text, text, text, text, text);

-- Recreate with correct column names
CREATE OR REPLACE FUNCTION copy_budget_as_new(
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
  v_new_function_id uuid;
  v_function_map jsonb := '{}'::jsonb;
BEGIN
  -- Buscar dados do orçamento original
  SELECT * INTO v_original_budget
  FROM budgets
  WHERE id = p_original_budget_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento com ID % não encontrado', p_original_budget_id;
  END IF;

  -- Obter ano atual
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Gerar novo budget_number
  v_new_budget_number := get_next_budget_number(v_current_year);

  -- Extrair o número sequencial do budget_number
  v_new_sequence := (SELECT COALESCE(MAX(sequence_number), 0) + 1 FROM budgets WHERE year = v_current_year);

  -- Criar novo orçamento
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
    lead_source
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
    COALESCE(p_new_lead_source, v_original_budget.lead_source)
  )
  RETURNING id INTO v_new_budget_id;

  -- Copiar budget_functions e criar mapeamento de IDs
  FOR v_function_record IN
    SELECT * FROM budget_functions WHERE budget_id = p_original_budget_id ORDER BY id
  LOOP
    INSERT INTO budget_functions (
      budget_id, function_name, quantity, salary, scale, shift_type,
      periculosity_percent, unhealthiness_percent, bonus_percent,
      night_additional_percent, hours_per_day, reduced_hour_percent,
      has_intrajornada, intrajornada_percent, vt_value, city, iss_rate
    ) VALUES (
      v_new_budget_id, v_function_record.function_name, v_function_record.quantity,
      v_function_record.salary, v_function_record.scale, v_function_record.shift_type,
      v_function_record.periculosity_percent, v_function_record.unhealthiness_percent,
      v_function_record.bonus_percent, v_function_record.night_additional_percent,
      v_function_record.hours_per_day, v_function_record.reduced_hour_percent,
      v_function_record.has_intrajornada, v_function_record.intrajornada_percent,
      v_function_record.vt_value, v_function_record.city, v_function_record.iss_rate
    )
    RETURNING id INTO v_new_function_id;

    -- Criar mapeamento: old_id -> new_id
    v_function_map := v_function_map || jsonb_build_object(v_function_record.id::text, v_new_function_id);
  END LOOP;

  -- Copiar budget_function_benefit_overrides (se existir) com nomes de colunas corretos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_function_benefit_overrides') THEN
    INSERT INTO budget_function_benefit_overrides (budget_id, function_id, benefit_code, custom_value, custom_formula, notes)
    SELECT 
      v_new_budget_id,
      function_id,
      benefit_code,
      custom_value,
      custom_formula,
      notes
    FROM budget_function_benefit_overrides
    WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar budget_encargos_overrides (se existir) com nomes de colunas corretos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_encargos_overrides') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'budget_encargos_overrides' AND column_name = 'custom_value'
    ) THEN
      -- Usar custom_value se existir
      INSERT INTO budget_encargos_overrides (budget_id, encargo_code, custom_value)
      SELECT v_new_budget_id, encargo_code, custom_value
      FROM budget_encargos_overrides
      WHERE budget_id = p_original_budget_id;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'budget_encargos_overrides' AND column_name = 'override_value'
    ) THEN
      -- Usar override_value se for esse o nome
      INSERT INTO budget_encargos_overrides (budget_id, encargo_code, override_value)
      SELECT v_new_budget_id, encargo_code, override_value
      FROM budget_encargos_overrides
      WHERE budget_id = p_original_budget_id;
    END IF;
  END IF;

  -- Copiar materials (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials') THEN
    INSERT INTO materials (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value
    FROM materials WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar equipments (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipments') THEN
    INSERT INTO equipments (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions
    FROM equipments WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar uniforms (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uniforms') THEN
    INSERT INTO uniforms (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, function_id)
    SELECT
      v_new_budget_id,
      name,
      brand,
      quantity,
      unit_value,
      total_value,
      amortization,
      monthly_value,
      (v_function_map->>(function_id::text))::uuid
    FROM uniforms
    WHERE budget_id = p_original_budget_id
      AND function_id IS NOT NULL
      AND v_function_map ? (function_id::text);
  END IF;

  -- Copiar capex (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'capex') THEN
    INSERT INTO capex (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions
    FROM capex WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar others (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'others') THEN
    INSERT INTO others (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions
    FROM others WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar differentiated_benefits (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'differentiated_benefits') THEN
    INSERT INTO differentiated_benefits (budget_id, function_id, benefit_type, custom_value)
    SELECT
      v_new_budget_id,
      (v_function_map->>(function_id::text))::uuid,
      benefit_type,
      custom_value
    FROM differentiated_benefits
    WHERE budget_id = p_original_budget_id
      AND function_id IS NOT NULL
      AND v_function_map ? (function_id::text);
  END IF;

  -- Copiar budget_calculations (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_calculations') THEN
    INSERT INTO budget_calculations (
      budget_id, function_data, total_contract, total_payroll, total_benefits,
      total_encargos, total_materials, total_equipments, total_uniforms,
      total_capex, total_others, total_differentiated_benefits
    )
    SELECT
      v_new_budget_id, function_data, total_contract, total_payroll, total_benefits,
      total_encargos, total_materials, total_equipments, total_uniforms,
      total_capex, total_others, total_differentiated_benefits
    FROM budget_calculations WHERE budget_id = p_original_budget_id;
  END IF;

  RETURN v_new_budget_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao copiar orçamento: %', SQLERRM;
END;
$$;
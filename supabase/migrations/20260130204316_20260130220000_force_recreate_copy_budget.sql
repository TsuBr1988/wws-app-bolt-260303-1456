/*
  ================================================================================
  FORCE RECREATE: Recriação completa da função copy_budget_as_new
  ================================================================================
  Remove completamente todas as versões e recria do zero
  ================================================================================
*/

-- Remove TODAS as possíveis versões da função de TODOS os schemas
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname as schema, p.proname as function_name
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'copy_budget_as_new'
    ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE', r.schema, r.function_name);
        RAISE NOTICE 'Dropped function %.%', r.schema, r.function_name;
    END LOOP;
END $$;

-- Agora cria a função nova sem referências a jsonb_object_length
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
SECURITY DEFINER
AS $$
DECLARE
  v_new_budget_id uuid;
  v_original_budget RECORD;
  v_function_record RECORD;
  v_equipment_record RECORD;
  v_new_budget_number text;
  v_current_year integer;
  v_new_sequence integer;
  v_new_function_id uuid;
  v_function_map jsonb := '{}'::jsonb;
  v_functions_copied integer := 0;
  v_materials_copied integer := 0;
  v_equipments_copied integer := 0;
  v_uniforms_copied integer := 0;
  v_differentiated_benefits_copied integer := 0;
  v_start_time timestamp;
BEGIN
  v_start_time := clock_timestamp();

  -- VALIDAÇÃO INICIAL
  SELECT * INTO v_original_budget
  FROM budgets
  WHERE id = p_original_budget_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento original com ID % não encontrado', p_original_budget_id;
  END IF;

  -- GERAÇÃO DO NÚMERO DO NOVO ORÇAMENTO
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  v_new_budget_number := get_next_budget_number(v_current_year);
  v_new_sequence := (
    SELECT COALESCE(MAX(sequence_number), 0) + 1
    FROM budgets
    WHERE year = v_current_year
  );

  -- CÓPIA DA TABELA PRINCIPAL: budgets
  INSERT INTO budgets (
    budget_number, sequence_number, client_name, description, name, vt_value, iss_rate,
    city, service_type, status, year, contact_name, contact_email, contact_phone,
    margem_lucro, margem_adm, city_name, cnpj, email, phone, address, lead_source
  )
  VALUES (
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

  -- CÓPIA DAS FUNÇÕES E CONSTRUÇÃO DO MAPA DE IDs
  FOR v_function_record IN
    SELECT * FROM budget_functions
    WHERE budget_id = p_original_budget_id
    ORDER BY id
  LOOP
    INSERT INTO budget_functions (
      budget_id, function_name, quantity, salary, scale, shift_type,
      periculosity_percent, unhealthiness_percent, bonus_percent, night_additional_percent,
      hours_per_day, reduced_hour_percent, has_intrajornada, intrajornada_percent,
      vt_value, city, iss_rate
    )
    VALUES (
      v_new_budget_id, v_function_record.function_name, v_function_record.quantity,
      v_function_record.salary, v_function_record.scale, v_function_record.shift_type,
      v_function_record.periculosity_percent, v_function_record.unhealthiness_percent,
      v_function_record.bonus_percent, v_function_record.night_additional_percent,
      v_function_record.hours_per_day, v_function_record.reduced_hour_percent,
      v_function_record.has_intrajornada, v_function_record.intrajornada_percent,
      v_function_record.vt_value, v_function_record.city, v_function_record.iss_rate
    )
    RETURNING id INTO v_new_function_id;

    v_function_map := v_function_map || jsonb_build_object(
      v_function_record.id::text,
      v_new_function_id
    );

    v_functions_copied := v_functions_copied + 1;
  END LOOP;

  -- CÓPIA DAS SOBRESCRITAS DE BENEFÍCIOS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_function_benefit_overrides') THEN
    INSERT INTO budget_function_benefit_overrides (budget_id, function_id, benefit_code, custom_value, custom_formula, notes)
    SELECT v_new_budget_id::text, function_id, benefit_code, custom_value, custom_formula, notes
    FROM budget_function_benefit_overrides WHERE budget_id = p_original_budget_id::text;
  END IF;

  -- CÓPIA DAS SOBRESCRITAS DE ENCARGOS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_encargos_overrides') THEN
    INSERT INTO budget_encargos_overrides (budget_id, grupo_code, encargo_code, encargo_name, custom_rate, notes)
    SELECT v_new_budget_id, grupo_code, encargo_code, encargo_name, custom_rate, notes
    FROM budget_encargos_overrides WHERE budget_id = p_original_budget_id;
  END IF;

  -- CÓPIA DE MATERIAIS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materials') THEN
    INSERT INTO materials (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value
    FROM materials WHERE budget_id = p_original_budget_id;
    GET DIAGNOSTICS v_materials_copied = ROW_COUNT;
  END IF;

  -- CÓPIA DE EQUIPAMENTOS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipments') THEN
    FOR v_equipment_record IN SELECT * FROM equipments WHERE budget_id = p_original_budget_id
    LOOP
      INSERT INTO equipments (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions, function_id)
      VALUES (
        v_new_budget_id, v_equipment_record.name, v_equipment_record.brand, v_equipment_record.quantity,
        v_equipment_record.unit_value, v_equipment_record.total_value, v_equipment_record.amortization,
        v_equipment_record.monthly_value, v_equipment_record.allocated_functions,
        CASE
          WHEN v_equipment_record.function_id IS NOT NULL AND v_function_map ? v_equipment_record.function_id::text
          THEN (v_function_map->>v_equipment_record.function_id::text)::uuid
          ELSE NULL
        END
      );
      v_equipments_copied := v_equipments_copied + 1;
    END LOOP;
  END IF;

  -- CÓPIA DE UNIFORMES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'uniforms') THEN
    INSERT INTO uniforms (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, function_id)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value,
           (v_function_map->>function_id::text)::uuid
    FROM uniforms
    WHERE budget_id = p_original_budget_id AND function_id IS NOT NULL AND v_function_map ? function_id::text;
    GET DIAGNOSTICS v_uniforms_copied = ROW_COUNT;
  END IF;

  -- CÓPIA DE CAPEX E OTHERS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'capex') THEN
    INSERT INTO capex (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions
    FROM capex WHERE budget_id = p_original_budget_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'others') THEN
    INSERT INTO others (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions
    FROM others WHERE budget_id = p_original_budget_id;
  END IF;

  -- CÓPIA DE BENEFÍCIOS DIFERENCIADOS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'differentiated_benefits') THEN
    INSERT INTO differentiated_benefits (budget_id, function_id, name, monthly_value)
    SELECT v_new_budget_id, (v_function_map->>function_id::text)::uuid, name, monthly_value
    FROM differentiated_benefits
    WHERE budget_id = p_original_budget_id AND function_id IS NOT NULL AND v_function_map ? function_id::text;
    GET DIAGNOSTICS v_differentiated_benefits_copied = ROW_COUNT;
  END IF;

  -- CÓPIA DE CÁLCULOS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_calculations') THEN
    INSERT INTO budget_calculations (budget_id, function_data, total_contract, total_payroll, total_benefits, total_encargos,
                                     total_materials, total_equipments, total_uniforms, total_capex, total_others, total_differentiated_benefits)
    SELECT v_new_budget_id, function_data, total_contract, total_payroll, total_benefits, total_encargos,
           total_materials, total_equipments, total_uniforms, total_capex, total_others, total_differentiated_benefits
    FROM budget_calculations WHERE budget_id = p_original_budget_id;
  END IF;

  RETURN v_new_budget_id;

EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE EXCEPTION 'ERRO: Violação de integridade referencial → %', SQLERRM;
  WHEN check_violation THEN
    RAISE EXCEPTION 'ERRO: Violação de validação de dados → %', SQLERRM;
  WHEN unique_violation THEN
    RAISE EXCEPTION 'ERRO: Tentativa de duplicação de dados únicos → %', SQLERRM;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'ERRO ao copiar orçamento → % (Código: %)', SQLERRM, SQLSTATE;
END;
$$;
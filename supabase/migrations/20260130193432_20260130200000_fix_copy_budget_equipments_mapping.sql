/*
  # Fix copy_budget_as_new function - Add equipments function_id mapping

  1. Changes
    - Fix equipments: map function_id from old to new using the function_map
    - Apply same logic as uniforms and differentiated_benefits
*/

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
  SELECT * INTO v_original_budget FROM budgets WHERE id = p_original_budget_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Orçamento com ID % não encontrado', p_original_budget_id; END IF;
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  v_new_budget_number := get_next_budget_number(v_current_year);
  v_new_sequence := (SELECT COALESCE(MAX(sequence_number), 0) + 1 FROM budgets WHERE year = v_current_year);
  INSERT INTO budgets (budget_number, sequence_number, client_name, description, name, vt_value, iss_rate, city, service_type, status, year, contact_name, contact_email, contact_phone, margem_lucro, margem_adm, city_name, cnpj, email, phone, address, lead_source) VALUES (v_new_budget_number, v_new_sequence, COALESCE(p_new_client_name, v_original_budget.client_name), COALESCE(p_new_description, v_original_budget.description), v_original_budget.name, v_original_budget.vt_value, v_original_budget.iss_rate, v_original_budget.city, v_original_budget.service_type, 'open', v_current_year, v_original_budget.contact_name, v_original_budget.contact_email, v_original_budget.contact_phone, v_original_budget.margem_lucro, v_original_budget.margem_adm, COALESCE(p_new_city_name, v_original_budget.city_name), COALESCE(p_new_cnpj, v_original_budget.cnpj), COALESCE(p_new_email, v_original_budget.email), COALESCE(p_new_phone, v_original_budget.phone), COALESCE(p_new_address, v_original_budget.address), COALESCE(p_new_lead_source, v_original_budget.lead_source)) RETURNING id INTO v_new_budget_id;
  FOR v_function_record IN SELECT * FROM budget_functions WHERE budget_id = p_original_budget_id ORDER BY id LOOP
    INSERT INTO budget_functions (budget_id, function_name, quantity, salary, scale, shift_type, periculosity_percent, unhealthiness_percent, bonus_percent, night_additional_percent, hours_per_day, reduced_hour_percent, has_intrajornada, intrajornada_percent, vt_value, city, iss_rate) VALUES (v_new_budget_id, v_function_record.function_name, v_function_record.quantity, v_function_record.salary, v_function_record.scale, v_function_record.shift_type, v_function_record.periculosity_percent, v_function_record.unhealthiness_percent, v_function_record.bonus_percent, v_function_record.night_additional_percent, v_function_record.hours_per_day, v_function_record.reduced_hour_percent, v_function_record.has_intrajornada, v_function_record.intrajornada_percent, v_function_record.vt_value, v_function_record.city, v_function_record.iss_rate) RETURNING id INTO v_new_function_id;
    v_function_map := v_function_map || jsonb_build_object(v_function_record.id::text, v_new_function_id);
  END LOOP;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_function_benefit_overrides') THEN INSERT INTO budget_function_benefit_overrides (budget_id, function_id, benefit_code, custom_value, custom_formula, notes) SELECT v_new_budget_id::text, function_id, benefit_code, custom_value, custom_formula, notes FROM budget_function_benefit_overrides WHERE budget_id = p_original_budget_id::text; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_encargos_overrides') THEN INSERT INTO budget_encargos_overrides (budget_id, grupo_code, encargo_code, encargo_name, custom_rate, notes) SELECT v_new_budget_id, grupo_code, encargo_code, encargo_name, custom_rate, notes FROM budget_encargos_overrides WHERE budget_id = p_original_budget_id; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materials') THEN INSERT INTO materials (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value) SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value FROM materials WHERE budget_id = p_original_budget_id; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipments') THEN INSERT INTO equipments (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions, function_id) SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions, CASE WHEN function_id IS NOT NULL AND v_function_map ? function_id::text THEN (v_function_map->>function_id::text)::uuid ELSE NULL END FROM equipments WHERE budget_id = p_original_budget_id; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'uniforms') THEN INSERT INTO uniforms (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, function_id) SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, (v_function_map->>function_id::text)::uuid FROM uniforms WHERE budget_id = p_original_budget_id AND function_id IS NOT NULL AND v_function_map ? function_id::text; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'capex') THEN INSERT INTO capex (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions) SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions FROM capex WHERE budget_id = p_original_budget_id; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'others') THEN INSERT INTO others (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions) SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions FROM others WHERE budget_id = p_original_budget_id; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'differentiated_benefits') THEN INSERT INTO differentiated_benefits (budget_id, function_id, name, monthly_value) SELECT v_new_budget_id, (v_function_map->>function_id::text)::uuid, name, monthly_value FROM differentiated_benefits WHERE budget_id = p_original_budget_id AND function_id IS NOT NULL AND v_function_map ? function_id::text; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_calculations') THEN INSERT INTO budget_calculations (budget_id, function_data, total_contract, total_payroll, total_benefits, total_encargos, total_materials, total_equipments, total_uniforms, total_capex, total_others, total_differentiated_benefits) SELECT v_new_budget_id, function_data, total_contract, total_payroll, total_benefits, total_encargos, total_materials, total_equipments, total_uniforms, total_capex, total_others, total_differentiated_benefits FROM budget_calculations WHERE budget_id = p_original_budget_id; END IF;
  RETURN v_new_budget_id;
EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'Erro ao copiar orçamento: %', SQLERRM;
END;
$$;
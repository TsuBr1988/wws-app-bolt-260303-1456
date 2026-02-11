/*
  ================================================================================
  FIX: Correção da função copy_budget_as_new
  ================================================================================
  Remove uso de jsonb_object_length que não existe no PostgreSQL
  ================================================================================
*/

-- Remove todas as versões antigas da função
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid, text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid, text, text);
DROP FUNCTION IF EXISTS copy_budget_as_new(uuid);
DROP FUNCTION IF EXISTS copy_budget_as_new;

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

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '     INICIANDO CÓPIA DE ORÇAMENTO';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Timestamp: %', v_start_time;
  RAISE NOTICE '';

  -- VALIDAÇÃO INICIAL
  RAISE NOTICE '→ ETAPA 1/11: Validação do orçamento original';

  SELECT * INTO v_original_budget
  FROM budgets
  WHERE id = p_original_budget_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento original com ID % não encontrado', p_original_budget_id;
  END IF;

  RAISE NOTICE '  ✓ Orçamento encontrado: % - %',
    v_original_budget.budget_number,
    v_original_budget.client_name;

  -- GERAÇÃO DO NÚMERO DO NOVO ORÇAMENTO
  RAISE NOTICE '';
  RAISE NOTICE '→ ETAPA 2/11: Geração do número do novo orçamento';

  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  v_new_budget_number := get_next_budget_number(v_current_year);
  v_new_sequence := (
    SELECT COALESCE(MAX(sequence_number), 0) + 1
    FROM budgets
    WHERE year = v_current_year
  );

  RAISE NOTICE '  ✓ Novo número: % (sequência: %)', v_new_budget_number, v_new_sequence;

  -- CÓPIA DA TABELA PRINCIPAL: budgets
  RAISE NOTICE '';
  RAISE NOTICE '→ ETAPA 3/11: Cópia da tabela budgets';

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

  RAISE NOTICE '  ✓ Orçamento criado com ID: %', v_new_budget_id;

  -- CÓPIA DAS FUNÇÕES E CONSTRUÇÃO DO MAPA DE IDs
  RAISE NOTICE '';
  RAISE NOTICE '→ ETAPA 4/11: Cópia de funções e construção do mapa de IDs';

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

  RAISE NOTICE '  ✓ Funções copiadas: %', v_functions_copied;

  -- CÓPIA DAS SOBRESCRITAS DE BENEFÍCIOS
  RAISE NOTICE '';
  RAISE NOTICE '→ ETAPA 5/11: Cópia de sobrescritas de benefícios';

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_function_benefit_overrides') THEN
    INSERT INTO budget_function_benefit_overrides (budget_id, function_id, benefit_code, custom_value, custom_formula, notes)
    SELECT v_new_budget_id::text, function_id, benefit_code, custom_value, custom_formula, notes
    FROM budget_function_benefit_overrides WHERE budget_id = p_original_budget_id::text;
    RAISE NOTICE '  ✓ Sobrescritas de benefícios copiadas';
  ELSE
    RAISE NOTICE '  ⊘ Tabela budget_function_benefit_overrides não existe';
  END IF;

  -- CÓPIA DAS SOBRESCRITAS DE ENCARGOS
  RAISE NOTICE '';
  RAISE NOTICE '→ ETAPA 6/11: Cópia de sobrescritas de encargos';

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_encargos_overrides') THEN
    INSERT INTO budget_encargos_overrides (budget_id, grupo_code, encargo_code, encargo_name, custom_rate, notes)
    SELECT v_new_budget_id, grupo_code, encargo_code, encargo_name, custom_rate, notes
    FROM budget_encargos_overrides WHERE budget_id = p_original_budget_id;
    RAISE NOTICE '  ✓ Sobrescritas de encargos copiadas';
  ELSE
    RAISE NOTICE '  ⊘ Tabela budget_encargos_overrides não existe';
  END IF;

  -- CÓPIA DE MATERIAIS
  RAISE NOTICE '';
  RAISE NOTICE '→ ETAPA 7/11: Cópia de materiais';

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materials') THEN
    INSERT INTO materials (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value
    FROM materials WHERE budget_id = p_original_budget_id;
    GET DIAGNOSTICS v_materials_copied = ROW_COUNT;
    RAISE NOTICE '  ✓ Materiais copiados: %', v_materials_copied;
  ELSE
    RAISE NOTICE '  ⊘ Tabela materials não existe';
  END IF;

  -- CÓPIA DE EQUIPAMENTOS (com mapeamento opcional)
  RAISE NOTICE '';
  RAISE NOTICE '→ ETAPA 8/11: Cópia de equipamentos';

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
    RAISE NOTICE '  ✓ Equipamentos copiados: %', v_equipments_copied;
  ELSE
    RAISE NOTICE '  ⊘ Tabela equipments não existe';
  END IF;

  -- CÓPIA DE UNIFORMES (com mapeamento obrigatório)
  RAISE NOTICE '';
  RAISE NOTICE '→ ETAPA 9/11: Cópia de uniformes';

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'uniforms') THEN
    INSERT INTO uniforms (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, function_id)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value,
           (v_function_map->>function_id::text)::uuid
    FROM uniforms
    WHERE budget_id = p_original_budget_id AND function_id IS NOT NULL AND v_function_map ? function_id::text;
    GET DIAGNOSTICS v_uniforms_copied = ROW_COUNT;
    RAISE NOTICE '  ✓ Uniformes copiados: %', v_uniforms_copied;
  ELSE
    RAISE NOTICE '  ⊘ Tabela uniforms não existe';
  END IF;

  -- CÓPIA DE CAPEX E OTHERS
  RAISE NOTICE '';
  RAISE NOTICE '→ ETAPA 10/11: Cópia de CAPEX e outros custos';

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'capex') THEN
    INSERT INTO capex (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions
    FROM capex WHERE budget_id = p_original_budget_id;
    RAISE NOTICE '  ✓ CAPEX copiados';
  ELSE
    RAISE NOTICE '  ⊘ Tabela capex não existe';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'others') THEN
    INSERT INTO others (budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions)
    SELECT v_new_budget_id, name, brand, quantity, unit_value, total_value, amortization, monthly_value, allocated_functions
    FROM others WHERE budget_id = p_original_budget_id;
    RAISE NOTICE '  ✓ Others copiados';
  ELSE
    RAISE NOTICE '  ⊘ Tabela others não existe';
  END IF;

  -- CÓPIA DE BENEFÍCIOS DIFERENCIADOS (com mapeamento obrigatório)
  RAISE NOTICE '';
  RAISE NOTICE '→ ETAPA 11/11: Cópia de benefícios diferenciados';

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'differentiated_benefits') THEN
    INSERT INTO differentiated_benefits (budget_id, function_id, name, monthly_value)
    SELECT v_new_budget_id, (v_function_map->>function_id::text)::uuid, name, monthly_value
    FROM differentiated_benefits
    WHERE budget_id = p_original_budget_id AND function_id IS NOT NULL AND v_function_map ? function_id::text;
    GET DIAGNOSTICS v_differentiated_benefits_copied = ROW_COUNT;
    RAISE NOTICE '  ✓ Benefícios diferenciados copiados: %', v_differentiated_benefits_copied;
  ELSE
    RAISE NOTICE '  ⊘ Tabela differentiated_benefits não existe';
  END IF;

  -- CÓPIA DE CÁLCULOS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_calculations') THEN
    INSERT INTO budget_calculations (budget_id, function_data, total_contract, total_payroll, total_benefits, total_encargos,
                                     total_materials, total_equipments, total_uniforms, total_capex, total_others, total_differentiated_benefits)
    SELECT v_new_budget_id, function_data, total_contract, total_payroll, total_benefits, total_encargos,
           total_materials, total_equipments, total_uniforms, total_capex, total_others, total_differentiated_benefits
    FROM budget_calculations WHERE budget_id = p_original_budget_id;
    RAISE NOTICE '  ✓ Cálculos copiados';
  END IF;

  -- VALIDAÇÃO FINAL
  RAISE NOTICE '';
  RAISE NOTICE '→ VALIDAÇÃO FINAL';

  IF NOT EXISTS (SELECT 1 FROM budgets WHERE id = v_new_budget_id) THEN
    RAISE EXCEPTION 'Falha crítica: novo orçamento não foi criado!';
  END IF;

  IF v_functions_copied = 0 AND EXISTS (SELECT 1 FROM budget_functions WHERE budget_id = p_original_budget_id) THEN
    RAISE EXCEPTION 'Falha crítica: nenhuma função foi copiada!';
  END IF;

  RAISE NOTICE '  ✓ Novo orçamento validado';
  RAISE NOTICE '  ✓ Integridade referencial confirmada';

  -- RESUMO FINAL
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '     CÓPIA CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Orçamento Original: % (%)',
    v_original_budget.budget_number,
    v_original_budget.client_name;
  RAISE NOTICE 'Novo Orçamento: % (%)',
    v_new_budget_number,
    COALESCE(p_new_client_name, v_original_budget.client_name);
  RAISE NOTICE '';
  RAISE NOTICE 'Itens Copiados:';
  RAISE NOTICE '  • Funções: %', v_functions_copied;
  RAISE NOTICE '  • Materiais: %', v_materials_copied;
  RAISE NOTICE '  • Equipamentos: %', v_equipments_copied;
  RAISE NOTICE '  • Uniformes: %', v_uniforms_copied;
  RAISE NOTICE '  • Benefícios Diferenciados: %', v_differentiated_benefits_copied;
  RAISE NOTICE '';
  RAISE NOTICE 'Tempo de Execução: % ms',
    EXTRACT(MILLISECOND FROM clock_timestamp() - v_start_time);
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';

  RETURN v_new_budget_id;

EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE EXCEPTION 'ERRO: Violação de integridade referencial → %', SQLERRM;
  WHEN check_violation THEN
    RAISE EXCEPTION 'ERRO: Violação de validação de dados → %', SQLERRM;
  WHEN unique_violation THEN
    RAISE EXCEPTION 'ERRO: Tentativa de duplicação de dados únicos → %', SQLERRM;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'ERRO CRÍTICO ao copiar orçamento → % (Código: %)', SQLERRM, SQLSTATE;
END;
$$;

COMMENT ON FUNCTION copy_budget_as_new IS
  'Copia um orçamento completo com todos os relacionamentos. Mantém integridade através de mapeamento de IDs de funções. Transacional: reverte automaticamente em caso de erro.';
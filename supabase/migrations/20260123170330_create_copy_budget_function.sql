/*
  # Criar função para copiar orçamentos
  
  1. Nova Função
    - `copy_budget_as_new` - Copia um orçamento existente criando um novo com número sequencial
    - Recebe o ID do orçamento original e informações opcionais para sobrescrever
    - Retorna o ID do novo orçamento criado
  
  2. Funcionalidades
    - Gera automaticamente novo budget_number seguindo sequência do ano
    - Copia todas as funções/cargos associadas
    - Copia materiais, equipamentos, uniformes, capex, outros itens
    - Copia benefícios diferenciados e overrides
    - Copia cálculos salvos
    - Não cria revisão (orçamento independente)
  
  3. Segurança
    - Validação de existência do orçamento original
    - Transação atômica (tudo ou nada)
    - Tratamento de erros com mensagens claras
*/

-- Criar função para copiar orçamento
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
  v_table_exists boolean;
BEGIN
  -- Verificar se a tabela budgets existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'budgets'
  ) INTO v_table_exists;
  
  IF NOT v_table_exists THEN
    RAISE EXCEPTION 'Tabela budgets não encontrada. Execute as migrações primeiro.';
  END IF;

  -- Buscar dados do orçamento original
  SELECT * INTO v_original_budget
  FROM budgets
  WHERE id = p_original_budget_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento com ID % não encontrado', p_original_budget_id;
  END IF;

  -- Obter ano atual
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Gerar novo budget_number usando a função RPC existente
  SELECT rpc INTO v_new_budget_number
  FROM get_next_budget_number(v_current_year);

  -- Criar novo orçamento (cópia independente, não é revisão)
  INSERT INTO budgets (
    budget_number,
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
    COALESCE(p_new_client_name, v_original_budget.client_name),
    COALESCE(p_new_description, v_original_budget.description),
    v_original_budget.name,
    v_original_budget.vt_value,
    v_original_budget.iss_rate,
    v_original_budget.city,
    v_original_budget.service_type,
    v_original_budget.status,
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

  -- Copiar budget_functions se a tabela existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_functions') THEN
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
  END IF;

  -- Copiar budget_materials se a tabela existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_materials') THEN
    INSERT INTO budget_materials (budget_id, material_id, quantity, unit_value, amortization_months, allocated_functions)
    SELECT v_new_budget_id, material_id, quantity, unit_value, amortization_months, allocated_functions
    FROM budget_materials WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar budget_equipments se a tabela existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_equipments') THEN
    INSERT INTO budget_equipments (budget_id, equipment_id, quantity, unit_value, amortization_months, allocated_functions)
    SELECT v_new_budget_id, equipment_id, quantity, unit_value, amortization_months, allocated_functions
    FROM budget_equipments WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar budget_uniforms se a tabela existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_uniforms') THEN
    INSERT INTO budget_uniforms (budget_id, uniform_id, quantity, unit_value, amortization_months, function_id)
    SELECT v_new_budget_id, uniform_id, quantity, unit_value, amortization_months, function_id
    FROM budget_uniforms WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar budget_capex se a tabela existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_capex') THEN
    INSERT INTO budget_capex (budget_id, capex_id, quantity, unit_value, amortization_months)
    SELECT v_new_budget_id, capex_id, quantity, unit_value, amortization_months
    FROM budget_capex WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar budget_others se a tabela existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_others') THEN
    INSERT INTO budget_others (budget_id, description, quantity, unit_value, amortization_months)
    SELECT v_new_budget_id, description, quantity, unit_value, amortization_months
    FROM budget_others WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar budget_differentiated_benefits se a tabela existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_differentiated_benefits') THEN
    INSERT INTO budget_differentiated_benefits (budget_id, function_id, benefit_name, value_per_employee)
    SELECT v_new_budget_id, function_id, benefit_name, value_per_employee
    FROM budget_differentiated_benefits WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar budget_function_benefit_overrides se a tabela existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_function_benefit_overrides') THEN
    INSERT INTO budget_function_benefit_overrides (budget_id, function_id, benefit_code, override_value)
    SELECT v_new_budget_id, function_id, benefit_code, override_value
    FROM budget_function_benefit_overrides WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar budget_encargos_overrides se a tabela existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_encargos_overrides') THEN
    INSERT INTO budget_encargos_overrides (budget_id, encargo_code, override_value)
    SELECT v_new_budget_id, encargo_code, override_value
    FROM budget_encargos_overrides WHERE budget_id = p_original_budget_id;
  END IF;

  -- Copiar budget_calculations se a tabela existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_calculations') THEN
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

  -- Retornar o ID do novo orçamento
  RETURN v_new_budget_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, fazer rollback e informar o erro
    RAISE EXCEPTION 'Erro ao copiar orçamento: %', SQLERRM;
END;
$$;

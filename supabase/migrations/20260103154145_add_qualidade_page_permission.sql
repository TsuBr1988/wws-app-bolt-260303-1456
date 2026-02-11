/*
  # Adicionar página Qualidade ao sistema de permissões

  1. Mudanças
    - Adiciona permissões de página 'qualidade' para todos os administradores
    - Adiciona 11 indicadores relacionados à gestão da qualidade para todos os administradores

  2. Indicadores Criados
    - Política da Qualidade
    - Contextos e Partes
    - Riscos e Oportunidades
    - Informação Documentada
    - Mapas de Processos
    - Procedimentos
    - RNC (Registro de Não Conformidades)
    - Pesquisa de Satisfação
    - Controle de Mudanças
    - Propriedade de Terceiros
    - Ata de Análise Crítica
*/

-- Conceder acesso à página Qualidade para todos os administradores
DO $$
DECLARE
  v_admin_user_id uuid;
BEGIN
  -- Para cada usuário admin
  FOR v_admin_user_id IN
    SELECT id FROM app_users WHERE is_admin = true
  LOOP
    -- Inserir permissão de página
    INSERT INTO user_permissions (user_id, page, can_view)
    VALUES (v_admin_user_id, 'qualidade', true)
    ON CONFLICT (user_id, page) DO NOTHING;
    
    -- Inserir permissões de indicadores
    INSERT INTO user_indicator_permissions (user_id, page, indicator_name, permission_level)
    VALUES
      (v_admin_user_id, 'qualidade', 'Política da Qualidade', 'edit'),
      (v_admin_user_id, 'qualidade', 'Contextos e Partes', 'edit'),
      (v_admin_user_id, 'qualidade', 'Riscos e Oportunidades', 'edit'),
      (v_admin_user_id, 'qualidade', 'Informação Documentada', 'edit'),
      (v_admin_user_id, 'qualidade', 'Mapas de Processos', 'edit'),
      (v_admin_user_id, 'qualidade', 'Procedimentos', 'edit'),
      (v_admin_user_id, 'qualidade', 'RNC', 'edit'),
      (v_admin_user_id, 'qualidade', 'Pesquisa de Satisfação', 'edit'),
      (v_admin_user_id, 'qualidade', 'Controle de Mudanças', 'edit'),
      (v_admin_user_id, 'qualidade', 'Propriedade de Terceiros', 'edit'),
      (v_admin_user_id, 'qualidade', 'Ata de Análise Crítica', 'edit')
    ON CONFLICT (user_id, page, indicator_name) DO NOTHING;
  END LOOP;
END $$;

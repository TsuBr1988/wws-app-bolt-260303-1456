/*
  # Corrigir Acesso Compartilhado ao Banco de Dados

  1. Políticas RLS Compartilhadas
    - Todos os usuários autenticados podem VER todos os dados
    - Apenas admins podem EDITAR/CRIAR/DELETAR na maioria das tabelas
    - SDRs e Closers podem EDITAR apenas propostas

  2. Segurança
    - Manter RLS ativo para segurança
    - Políticas baseadas no role do usuário
    - Acesso de leitura universal para usuários autenticados
*/

-- Limpar políticas existentes que podem estar causando isolamento
DROP POLICY IF EXISTS "Users can read own data" ON user_profiles;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON user_profiles;
DROP POLICY IF EXISTS "enable_update_for_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "enable_delete_for_service_role" ON user_profiles;

DROP POLICY IF EXISTS "Authenticated users can read employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can delete employees" ON employees;

DROP POLICY IF EXISTS "Authenticated users can manage proposals" ON proposals;
DROP POLICY IF EXISTS "Authenticated users can manage weekly_performance" ON weekly_performance;
DROP POLICY IF EXISTS "Authenticated users can manage bonus_contributions" ON bonus_contributions;
DROP POLICY IF EXISTS "Authenticated users can manage recognitions" ON recognitions;
DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can read rewards" ON rewards;
DROP POLICY IF EXISTS "Authenticated users can read badges" ON badges;
DROP POLICY IF EXISTS "Authenticated users can manage employee_badges" ON employee_badges;
DROP POLICY IF EXISTS "Authenticated users can manage probability_scores" ON probability_scores;
DROP POLICY IF EXISTS "authenticated_users_full_access" ON system_configurations;

-- Função helper para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função helper para verificar se o usuário pode editar propostas
CREATE OR REPLACE FUNCTION can_edit_proposals()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'closer', 'sdr')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- POLÍTICAS PARA user_profiles
-- =============================================

-- Todos podem ler perfis (necessário para mostrar nomes, etc)
CREATE POLICY "Anyone authenticated can read profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seu próprio perfil OU admins podem atualizar qualquer perfil
CREATE POLICY "Users can update own profile or admins can update any"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- Apenas admins podem deletar perfis
CREATE POLICY "Only admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================
-- POLÍTICAS PARA employees
-- =============================================

-- Todos podem ler funcionários
CREATE POLICY "Anyone authenticated can read employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem inserir funcionários
CREATE POLICY "Only admins can insert employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Apenas admins podem atualizar funcionários
CREATE POLICY "Only admins can update employees"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Apenas admins podem deletar funcionários
CREATE POLICY "Only admins can delete employees"
  ON employees
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================
-- POLÍTICAS PARA proposals
-- =============================================

-- Todos podem ler propostas
CREATE POLICY "Anyone authenticated can read proposals"
  ON proposals
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins, Closers e SDRs podem inserir propostas
CREATE POLICY "Authorized users can insert proposals"
  ON proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (can_edit_proposals());

-- Admins, Closers e SDRs podem atualizar propostas
CREATE POLICY "Authorized users can update proposals"
  ON proposals
  FOR UPDATE
  TO authenticated
  USING (can_edit_proposals())
  WITH CHECK (can_edit_proposals());

-- Apenas admins podem deletar propostas
CREATE POLICY "Only admins can delete proposals"
  ON proposals
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================
-- POLÍTICAS PARA weekly_performance
-- =============================================

-- Todos podem ler performance semanal
CREATE POLICY "Anyone authenticated can read weekly_performance"
  ON weekly_performance
  FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem inserir/atualizar performance
CREATE POLICY "Only admins can manage weekly_performance"
  ON weekly_performance
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- POLÍTICAS PARA outras tabelas (apenas admins editam)
-- =============================================

-- bonus_contributions
CREATE POLICY "Anyone authenticated can read bonus_contributions"
  ON bonus_contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage bonus_contributions"
  ON bonus_contributions FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- recognitions
CREATE POLICY "Anyone authenticated can read recognitions"
  ON recognitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage recognitions"
  ON recognitions FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- campaigns
CREATE POLICY "Anyone authenticated can read campaigns"
  ON campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage campaigns"
  ON campaigns FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- rewards
CREATE POLICY "Anyone authenticated can read rewards"
  ON rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage rewards"
  ON rewards FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- badges
CREATE POLICY "Anyone authenticated can read badges"
  ON badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage badges"
  ON badges FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- employee_badges
CREATE POLICY "Anyone authenticated can read employee_badges"
  ON employee_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage employee_badges"
  ON employee_badges FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- probability_scores
CREATE POLICY "Anyone authenticated can read probability_scores"
  ON probability_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can manage probability_scores"
  ON probability_scores FOR ALL TO authenticated USING (can_edit_proposals()) WITH CHECK (can_edit_proposals());

-- system_configurations
CREATE POLICY "Anyone authenticated can read system_configurations"
  ON system_configurations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage system_configurations"
  ON system_configurations FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Otimizar performance
ANALYZE user_profiles;
ANALYZE employees;
ANALYZE proposals;
ANALYZE weekly_performance;
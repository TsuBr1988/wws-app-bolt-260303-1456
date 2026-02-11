/*
  ========================================
  SQL CONSOLIDADO - MÓDULO TI (CHAMADOS)
  ========================================

  Este arquivo contém todas as tabelas, índices, triggers e políticas RLS
  necessárias para o módulo de TI (Chamados) funcionar corretamente.

  Instruções:
  1. Execute este SQL no SQL Editor do Supabase
  2. Aguarde a confirmação de sucesso
  3. O sistema estará pronto para uso
*/

-- ========================================
-- 1. CRIAR TABELA TI_CHAMADOS
-- ========================================

CREATE TABLE IF NOT EXISTS ti_chamados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_numero integer UNIQUE NOT NULL,
  titulo text NOT NULL CHECK (TRIM(titulo) <> ''),
  descricao text NOT NULL,
  tipo text NOT NULL DEFAULT 'Correção' CHECK (tipo IN ('Estrutural', 'Melhoria', 'Correção')),
  modulo text NOT NULL DEFAULT 'Geral',
  prioridade text NOT NULL DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  categoria text NOT NULL DEFAULT 'Outros' CHECK (categoria IN ('Hardware', 'Software', 'Rede', 'Acesso', 'Email', 'Telefonia', 'Impressora', 'Outros')),
  status text NOT NULL DEFAULT 'A fazer' CHECK (status IN ('A fazer', 'Fazendo', 'Feito')),
  solicitante_nome text NOT NULL,
  solicitante_email text NOT NULL,
  responsavel_id uuid,
  responsavel_nome text,
  data_abertura timestamptz NOT NULL DEFAULT now(),
  data_inicio timestamptz,
  data_conclusao timestamptz,
  prazo_estimado timestamptz,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ========================================
-- 2. CRIAR SEQUENCE PARA NÚMERO DE CHAMADOS
-- ========================================

CREATE SEQUENCE IF NOT EXISTS ti_chamados_numero_seq START WITH 1;

-- ========================================
-- 3. CRIAR FUNÇÃO PARA AUTO-INCREMENTAR NÚMERO
-- ========================================

CREATE OR REPLACE FUNCTION set_chamado_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.chamado_numero IS NULL THEN
    NEW.chamado_numero := nextval('ti_chamados_numero_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. CRIAR TRIGGER PARA AUTO-INCREMENTAR
-- ========================================

DROP TRIGGER IF EXISTS trigger_set_chamado_numero ON ti_chamados;
CREATE TRIGGER trigger_set_chamado_numero
  BEFORE INSERT ON ti_chamados
  FOR EACH ROW
  EXECUTE FUNCTION set_chamado_numero();

-- ========================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_ti_chamados_status ON ti_chamados(status);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_data_abertura ON ti_chamados(data_abertura DESC);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_responsavel_id ON ti_chamados(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_numero ON ti_chamados(chamado_numero);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_tipo ON ti_chamados(tipo);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_modulo ON ti_chamados(modulo);

-- ========================================
-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE ti_chamados ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. CRIAR POLÍTICAS RLS
-- ========================================

-- Permitir usuários autenticados visualizarem todos os chamados
CREATE POLICY "Authenticated users can read all chamados"
  ON ti_chamados FOR SELECT
  TO authenticated
  USING (true);

-- Permitir usuários autenticados criarem chamados
CREATE POLICY "Authenticated users can create chamados"
  ON ti_chamados FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir usuários autenticados atualizarem chamados
CREATE POLICY "Authenticated users can update chamados"
  ON ti_chamados FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir usuários autenticados deletarem chamados
CREATE POLICY "Authenticated users can delete chamados"
  ON ti_chamados FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- 8. INSERIR DADOS DE EXEMPLO (OPCIONAL)
-- ========================================

-- Descomente as linhas abaixo se quiser inserir dados de exemplo para testar

/*
INSERT INTO ti_chamados (
  titulo,
  descricao,
  tipo,
  modulo,
  prioridade,
  categoria,
  status,
  solicitante_nome,
  solicitante_email
) VALUES
(
  'Erro ao acessar sistema de orçamentos',
  'Sistema apresenta erro 500 ao tentar acessar a página de orçamentos',
  'Correção',
  'Comercial Privado',
  'Alta',
  'Software',
  'A fazer',
  'João Silva',
  'joao.silva@empresa.com'
),
(
  'Implementar filtro por data na aba de chamados',
  'Adicionar filtro para filtrar chamados por período de abertura',
  'Melhoria',
  'TI',
  'Média',
  'Software',
  'A fazer',
  'Maria Santos',
  'maria.santos@empresa.com'
),
(
  'Computador lento no setor financeiro',
  'Computador da estação 3 está muito lento, precisa verificar',
  'Estrutural',
  'Financeiro',
  'Baixa',
  'Hardware',
  'Fazendo',
  'Pedro Costa',
  'pedro.costa@empresa.com'
);
*/

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Execute esta query para verificar se tudo foi criado corretamente
SELECT
  'ti_chamados' as tabela,
  COUNT(*) as total_registros
FROM ti_chamados;

-- Execute para verificar a sequence
SELECT last_value FROM ti_chamados_numero_seq;

-- ========================================
-- MIGRATION CONCLUÍDA COM SUCESSO!
-- ========================================

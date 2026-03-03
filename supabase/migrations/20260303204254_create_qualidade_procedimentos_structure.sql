/*
  # Sistema de Procedimentos da Qualidade com Hierarquia de 3 Níveis

  1. Nova Estrutura
    - `qualidade_procedimentos_departamentos` - Departamentos (nível 1)
    - `qualidade_procedimentos_pastas` - 11 Pastas Padrão por departamento (nível 2)
    - `qualidade_procedimentos` - Procedimentos dentro de pastas (nível 3)
    - `qualidade_procedimentos_indicadores` - Indicadores de desempenho por procedimento

  2. Trigger Automático
    - Ao criar departamento, 11 pastas padrão são criadas automaticamente
    - Pastas: Procedimentos, Instruções de Trabalho, Políticas, Manuais, Formulários,
      Registros, Planilhas, Relatórios, Normas Externas, Contratos, Documentos Legais

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Apenas usuários autenticados podem acessar

  4. Relacionamentos
    - Departamento → Pastas (1:N, cascade delete)
    - Pasta → Procedimentos (1:N, restrict delete)
    - Procedimento → Indicadores (1:N, cascade delete)
*/

-- =====================================================
-- TABELA: qualidade_procedimentos_departamentos
-- =====================================================
CREATE TABLE IF NOT EXISTS qualidade_procedimentos_departamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índice para buscas por nome
CREATE INDEX IF NOT EXISTS idx_procedimentos_departamentos_name
  ON qualidade_procedimentos_departamentos(name);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_qualidade_procedimentos_departamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_procedimentos_departamentos_updated_at ON qualidade_procedimentos_departamentos;

CREATE TRIGGER trigger_update_procedimentos_departamentos_updated_at
  BEFORE UPDATE ON qualidade_procedimentos_departamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_qualidade_procedimentos_departamentos_updated_at();

-- =====================================================
-- TABELA: qualidade_procedimentos_pastas
-- =====================================================
CREATE TABLE IF NOT EXISTS qualidade_procedimentos_pastas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  icone text,
  ordem integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Foreign key com cascade delete
  CONSTRAINT fk_pasta_departamento
    FOREIGN KEY (departamento_id)
    REFERENCES qualidade_procedimentos_departamentos(id)
    ON DELETE CASCADE,

  -- Constraint para evitar pastas duplicadas no mesmo departamento
  CONSTRAINT unique_pasta_por_departamento
    UNIQUE (departamento_id, slug)
);

-- Índice para buscar pastas por departamento
CREATE INDEX IF NOT EXISTS idx_procedimentos_pastas_departamento
  ON qualidade_procedimentos_pastas(departamento_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_qualidade_procedimentos_pastas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_procedimentos_pastas_updated_at ON qualidade_procedimentos_pastas;

CREATE TRIGGER trigger_update_procedimentos_pastas_updated_at
  BEFORE UPDATE ON qualidade_procedimentos_pastas
  FOR EACH ROW
  EXECUTE FUNCTION update_qualidade_procedimentos_pastas_updated_at();

-- =====================================================
-- FUNÇÃO E TRIGGER: Criar 11 pastas padrão automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION criar_pastas_padrao_procedimentos()
RETURNS TRIGGER AS $$
BEGIN
  -- Insere as 11 pastas padrão para o novo departamento
  -- Usa ON CONFLICT para ser idempotente
  INSERT INTO qualidade_procedimentos_pastas (departamento_id, name, slug, icone, ordem)
  VALUES
    (NEW.id, 'Procedimentos', 'procedimentos', 'FileText', 1),
    (NEW.id, 'Instruções de Trabalho', 'instrucoes-trabalho', 'Wrench', 2),
    (NEW.id, 'Políticas', 'politicas', 'Shield', 3),
    (NEW.id, 'Manuais', 'manuais', 'BookOpen', 4),
    (NEW.id, 'Formulários', 'formularios', 'ClipboardList', 5),
    (NEW.id, 'Registros', 'registros', 'Database', 6),
    (NEW.id, 'Planilhas', 'planilhas', 'Table', 7),
    (NEW.id, 'Relatórios', 'relatorios', 'BarChart', 8),
    (NEW.id, 'Normas Externas', 'normas-externas', 'Scale', 9),
    (NEW.id, 'Contratos', 'contratos', 'FileSignature', 10),
    (NEW.id, 'Documentos Legais', 'documentos-legais', 'Gavel', 11)
  ON CONFLICT (departamento_id, slug) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_criar_pastas_padrao ON qualidade_procedimentos_departamentos;

CREATE TRIGGER trigger_criar_pastas_padrao
  AFTER INSERT ON qualidade_procedimentos_departamentos
  FOR EACH ROW
  EXECUTE FUNCTION criar_pastas_padrao_procedimentos();

-- =====================================================
-- TABELA: qualidade_procedimentos
-- =====================================================
CREATE TABLE IF NOT EXISTS qualidade_procedimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id uuid,
  pasta_id uuid NOT NULL,
  elaborado_por text NOT NULL,
  tipo text NOT NULL,
  nome_procedimento text,
  objetivos text,
  documentos_relacionados text,
  definicoes text,
  responsabilidades text,
  escopo text,
  fluxo_operacionalizacao text,
  sistematica text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Foreign keys
  CONSTRAINT fk_procedimento_departamento
    FOREIGN KEY (departamento_id)
    REFERENCES qualidade_procedimentos_departamentos(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_procedimento_pasta
    FOREIGN KEY (pasta_id)
    REFERENCES qualidade_procedimentos_pastas(id)
    ON DELETE RESTRICT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_procedimentos_departamento
  ON qualidade_procedimentos(departamento_id);

CREATE INDEX IF NOT EXISTS idx_procedimentos_pasta
  ON qualidade_procedimentos(pasta_id);

CREATE INDEX IF NOT EXISTS idx_procedimentos_created_at
  ON qualidade_procedimentos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_procedimentos_departamento_pasta
  ON qualidade_procedimentos(departamento_id, pasta_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_qualidade_procedimentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_procedimentos_updated_at ON qualidade_procedimentos;

CREATE TRIGGER trigger_update_procedimentos_updated_at
  BEFORE UPDATE ON qualidade_procedimentos
  FOR EACH ROW
  EXECUTE FUNCTION update_qualidade_procedimentos_updated_at();

-- =====================================================
-- TABELA: qualidade_procedimentos_indicadores
-- =====================================================
CREATE TABLE IF NOT EXISTS qualidade_procedimentos_indicadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedimento_id uuid NOT NULL,
  nome_indicador text NOT NULL,
  o_que_mede text,
  metrica text,
  periodicidade text,
  ordem integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),

  -- Foreign key com cascade delete
  CONSTRAINT fk_indicador_procedimento
    FOREIGN KEY (procedimento_id)
    REFERENCES qualidade_procedimentos(id)
    ON DELETE CASCADE,

  -- Constraint de ordem positiva
  CONSTRAINT check_ordem_positiva
    CHECK (ordem > 0)
);

-- Índice para buscar indicadores por procedimento
CREATE INDEX IF NOT EXISTS idx_procedimentos_indicadores_procedimento
  ON qualidade_procedimentos_indicadores(procedimento_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE qualidade_procedimentos_departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualidade_procedimentos_pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualidade_procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualidade_procedimentos_indicadores ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS SIMPLIFICADAS (apenas usuários autenticados)
-- =====================================================

-- Políticas para departamentos
DROP POLICY IF EXISTS "Usuários autenticados podem tudo nos departamentos" ON qualidade_procedimentos_departamentos;
CREATE POLICY "Usuários autenticados podem tudo nos departamentos"
  ON qualidade_procedimentos_departamentos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para pastas
DROP POLICY IF EXISTS "Usuários autenticados podem tudo nas pastas" ON qualidade_procedimentos_pastas;
CREATE POLICY "Usuários autenticados podem tudo nas pastas"
  ON qualidade_procedimentos_pastas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para procedimentos
DROP POLICY IF EXISTS "Usuários autenticados podem tudo nos procedimentos" ON qualidade_procedimentos;
CREATE POLICY "Usuários autenticados podem tudo nos procedimentos"
  ON qualidade_procedimentos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para indicadores
DROP POLICY IF EXISTS "Usuários autenticados podem tudo nos indicadores" ON qualidade_procedimentos_indicadores;
CREATE POLICY "Usuários autenticados podem tudo nos indicadores"
  ON qualidade_procedimentos_indicadores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

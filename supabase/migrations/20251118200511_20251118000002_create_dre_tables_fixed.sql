/*
  # Criar estrutura completa de DRE por contrato

  1. Novas Tabelas
    - `contratos_dre`
      - Armazena informações de cada contrato/posto extraído das abas do Excel
      - Campos: id, codigo, nome, ativo, timestamps
      - Unique constraint em codigo

    - `categorias_dre`
      - Dicionário da estrutura do DRE (configurado manualmente uma vez)
      - Campos: id, codigo, nome, grupo, natureza, ordem, timestamps
      - Unique constraint em (grupo, nome)

    - `dre_postos`
      - Tabela de fatos com valores mensais por contrato, categoria e tipo
      - Campos: id, contrato_id, categoria_id, competencia, tipo, valor, timestamps
      - Unique constraint em (contrato_id, categoria_id, competencia, tipo)

  2. Security
    - RLS habilitado em todas as tabelas
    - Políticas para usuários autenticados
*/

-- Tabela de contratos (cada aba do Excel)
CREATE TABLE IF NOT EXISTS contratos_dre (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (codigo)
);

ALTER TABLE contratos_dre ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler contratos DRE"
  ON contratos_dre FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir contratos DRE"
  ON contratos_dre FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar contratos DRE"
  ON contratos_dre FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar contratos DRE"
  ON contratos_dre FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de categorias do DRE (estrutura configurável)
CREATE TABLE IF NOT EXISTS categorias_dre (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text,
  nome text NOT NULL,
  grupo text NOT NULL,
  natureza text,
  ordem integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (grupo, nome)
);

ALTER TABLE categorias_dre ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler categorias DRE"
  ON categorias_dre FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir categorias DRE"
  ON categorias_dre FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar categorias DRE"
  ON categorias_dre FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar categorias DRE"
  ON categorias_dre FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de fatos DRE (valores por mês/contrato/categoria)
CREATE TABLE IF NOT EXISTS dre_postos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES contratos_dre(id) ON DELETE CASCADE,
  categoria_id uuid NOT NULL REFERENCES categorias_dre(id) ON DELETE RESTRICT,
  competencia date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('previsto', 'realizado')),
  valor numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (contrato_id, categoria_id, competencia, tipo)
);

CREATE INDEX IF NOT EXISTS idx_dre_postos_contrato_competencia
  ON dre_postos(contrato_id, competencia);

CREATE INDEX IF NOT EXISTS idx_dre_postos_categoria
  ON dre_postos(categoria_id);

ALTER TABLE dre_postos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler DRE postos"
  ON dre_postos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir DRE postos"
  ON dre_postos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar DRE postos"
  ON dre_postos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar DRE postos"
  ON dre_postos FOR DELETE
  TO authenticated
  USING (true);

-- View para resumo DRE por contrato
CREATE OR REPLACE VIEW dre_resumo_por_contrato AS
SELECT
  c.id as contrato_id,
  c.codigo as contrato_codigo,
  c.nome as contrato_nome,
  dp.competencia,
  dp.tipo,
  cat.grupo,
  cat.natureza,
  SUM(dp.valor) as valor_total
FROM dre_postos dp
JOIN contratos_dre c ON dp.contrato_id = c.id
JOIN categorias_dre cat ON dp.categoria_id = cat.id
GROUP BY c.id, c.codigo, c.nome, dp.competencia, dp.tipo, cat.grupo, cat.natureza
ORDER BY c.codigo, dp.competencia DESC;

-- View detalhada com todas as informações
CREATE OR REPLACE VIEW dre_detalhado AS
SELECT
  dp.id,
  c.codigo as contrato_codigo,
  c.nome as contrato_nome,
  cat.codigo as categoria_codigo,
  cat.nome as categoria_nome,
  cat.grupo as categoria_grupo,
  cat.natureza as categoria_natureza,
  cat.ordem as categoria_ordem,
  dp.competencia,
  dp.tipo,
  dp.valor,
  dp.created_at,
  dp.updated_at
FROM dre_postos dp
JOIN contratos_dre c ON dp.contrato_id = c.id
JOIN categorias_dre cat ON dp.categoria_id = cat.id
ORDER BY c.codigo, dp.competencia DESC, cat.ordem, dp.tipo;
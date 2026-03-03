/*
  # Criar tabelas para Qualidade - Procedimentos

  1. Novas Tabelas
    - `qualidade_procedimentos_departamentos`
      - `id` (uuid, primary key)
      - `name` (text) - Nome do departamento
      - `icon` (text) - Ícone visual
      - `description` (text) - Descrição do departamento
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização

    - `qualidade_procedimentos`
      - `id` (uuid, primary key)
      - `department_id` (uuid, foreign key) - Referência ao departamento
      - `elaborado_por` (text) - Responsável pela elaboração
      - `tipo` (text) - Tipo de procedimento
      - `nome_procedimento` (text, nullable) - Nome do procedimento
      - `objetivos` (text, nullable) - Objetivos
      - `documentos_relacionados` (text, nullable) - Documentos relacionados
      - `definicoes` (text, nullable) - Definições
      - `responsabilidades` (text, nullable) - Responsabilidades
      - `escopo` (text, nullable) - Escopo
      - `fluxo_operacionalizacao` (text, nullable) - Fluxo de operacionalização
      - `sistematica` (text, nullable) - Sistemática
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização

    - `qualidade_procedimentos_indicadores`
      - `id` (uuid, primary key)
      - `procedure_id` (uuid, foreign key) - Referência ao procedimento
      - `nome_indicador` (text) - Nome do indicador
      - `o_que_mede` (text) - O que mede
      - `metrica` (text) - Métrica
      - `periodicidade` (text) - Periodicidade
      - `created_at` (timestamptz) - Data de criação

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados poderem visualizar, criar e editar
*/

-- Criar tabela de departamentos de procedimentos
CREATE TABLE IF NOT EXISTS qualidade_procedimentos_departamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'file-text',
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de procedimentos
CREATE TABLE IF NOT EXISTS qualidade_procedimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES qualidade_procedimentos_departamentos(id) ON DELETE CASCADE,
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
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de indicadores de procedimentos
CREATE TABLE IF NOT EXISTS qualidade_procedimentos_indicadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES qualidade_procedimentos(id) ON DELETE CASCADE,
  nome_indicador text NOT NULL DEFAULT '',
  o_que_mede text NOT NULL DEFAULT '',
  metrica text NOT NULL DEFAULT '',
  periodicidade text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_qualidade_procedimentos_department ON qualidade_procedimentos(department_id);
CREATE INDEX IF NOT EXISTS idx_qualidade_procedimentos_indicadores_procedure ON qualidade_procedimentos_indicadores(procedure_id);

-- Habilitar RLS
ALTER TABLE qualidade_procedimentos_departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualidade_procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualidade_procedimentos_indicadores ENABLE ROW LEVEL SECURITY;

-- Políticas para departamentos - Permitir acesso total para usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar departamentos"
  ON qualidade_procedimentos_departamentos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir departamentos"
  ON qualidade_procedimentos_departamentos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar departamentos"
  ON qualidade_procedimentos_departamentos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar departamentos"
  ON qualidade_procedimentos_departamentos
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para procedimentos - Permitir acesso total para usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar procedimentos"
  ON qualidade_procedimentos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir procedimentos"
  ON qualidade_procedimentos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar procedimentos"
  ON qualidade_procedimentos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar procedimentos"
  ON qualidade_procedimentos
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para indicadores - Permitir acesso total para usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar indicadores"
  ON qualidade_procedimentos_indicadores
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir indicadores"
  ON qualidade_procedimentos_indicadores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar indicadores"
  ON qualidade_procedimentos_indicadores
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar indicadores"
  ON qualidade_procedimentos_indicadores
  FOR DELETE
  TO authenticated
  USING (true);

-- Inserir departamento padrão "Qualidade"
INSERT INTO qualidade_procedimentos_departamentos (id, name, icon, description)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Qualidade',
  'file-text',
  'Documentação e controles da área da Qualidade'
)
ON CONFLICT (id) DO NOTHING;
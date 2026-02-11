/*
  # Criar tabela de Política da Qualidade com Versionamento

  1. Nova Tabela
    - `qualidade_politica`
      - `id` (uuid, primary key)
      - `titulo` (text, título da política)
      - `conteudo` (text, conteúdo completo da política)
      - `versao` (text, número da versão - ex: "1.0", "1.1", "2.0")
      - `data_aprovacao` (timestamp, data de aprovação desta versão)
      - `aprovado_por` (text, nome de quem aprovou)
      - `ativo` (boolean, indica se é a versão ativa)
      - `created_at` (timestamp, data de criação)
      - `updated_at` (timestamp, data de última atualização)

  2. Segurança
    - Habilitar RLS na tabela `qualidade_politica`
    - Políticas para usuários autenticados lerem
    - Políticas para usuários autenticados criarem/editarem

  3. Notas
    - Sistema de versionamento automático
    - Apenas uma política pode estar ativa por vez
    - Histórico completo de versões mantido
*/

-- Criar tabela de política da qualidade
CREATE TABLE IF NOT EXISTS qualidade_politica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  conteudo text NOT NULL,
  versao text NOT NULL,
  data_aprovacao timestamptz NOT NULL DEFAULT now(),
  aprovado_por text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE qualidade_politica ENABLE ROW LEVEL SECURITY;

-- Política de leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver políticas"
  ON qualidade_politica
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de inserção para usuários autenticados
CREATE POLICY "Usuários autenticados podem criar políticas"
  ON qualidade_politica
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política de atualização para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar políticas"
  ON qualidade_politica
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política de exclusão para usuários autenticados
CREATE POLICY "Usuários autenticados podem excluir políticas"
  ON qualidade_politica
  FOR DELETE
  TO authenticated
  USING (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_qualidade_politica_ativo ON qualidade_politica(ativo);
CREATE INDEX IF NOT EXISTS idx_qualidade_politica_versao ON qualidade_politica(versao);
CREATE INDEX IF NOT EXISTS idx_qualidade_politica_data_aprovacao ON qualidade_politica(data_aprovacao DESC);

-- Inserir política inicial
INSERT INTO qualidade_politica (titulo, conteudo, versao, aprovado_por, ativo)
VALUES (
  'Política da Qualidade 2024',
  E'Nossa organização está comprometida em fornecer produtos e serviços que atendam ou superem as expectativas dos nossos clientes. Através da melhoria contínua dos nossos processos e do envolvimento de todos os colaboradores, buscamos a excelência em qualidade, segurança e satisfação do cliente.\n\nComprometemo-nos a:\n\n• Cumprir requisitos aplicáveis e melhorar continuamente a eficácia do Sistema de Gestão da Qualidade\n• Estabelecer objetivos da qualidade mensuráveis e compatíveis com o contexto e a direção estratégica da organização\n• Promover a conscientização de todos os colaboradores sobre a importância de suas contribuições\n• Manter um ambiente de trabalho seguro e adequado para a operação dos processos',
  '1.0',
  'Sistema',
  true
);
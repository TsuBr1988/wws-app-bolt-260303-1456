/*
  # Criar coluna etapa_maxima na tabela proposals

  1. Novo ENUM
    - `etapa_maxima_type` com todos os valores possíveis para ambos departamentos
  
  2. Nova Coluna
    - `etapa_maxima` na tabela `proposals`
    - Tipo: etapa_maxima_type
    - Padrão: 'Proposta'
  
  3. Segurança
    - Políticas RLS existentes se aplicam automaticamente
*/

-- Criar novo ENUM com todos os valores possíveis (Comercial Público + Petrobras)
CREATE TYPE etapa_maxima_type AS ENUM (
  -- Valores para Comercial Público
  'Desclassificados no início',
  'Edital não qualificado',
  'Em negociação',
  'Proposta',
  'Lances',
  'Declinamos/ Não teve pregão',
  'Desclassificado na planilha',
  'Inabilitado',
  'Planilha aceita / Aguardando habilitação',
  'Habilitado/ Aguardando recurso',
  'Contrato assinado',
  
  -- Valores específicos para Petrobras
  'Suspenso',
  'Encerrado',
  'Em montagem',
  'Classificação',
  'Avaliação de efetividade (avaliação de planilha)',
  'Habilitação',
  'Relatório de divulgação',
  'Abertura de recursos',
  'Relatório final / Homologação'
);

-- Adicionar nova coluna etapa_maxima à tabela proposals
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS etapa_maxima etapa_maxima_type DEFAULT 'Proposta';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_proposals_etapa_maxima 
ON proposals (etapa_maxima);

-- Comentário na coluna
COMMENT ON COLUMN proposals.etapa_maxima IS 'Etapa máxima atingida na licitação - valores específicos por departamento';
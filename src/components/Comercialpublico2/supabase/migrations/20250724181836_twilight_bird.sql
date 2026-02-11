/*
  # Atualizar ENUM proposal_status com todas as etapas

  1. Atualizações
    - Adicionar novos valores ao ENUM `proposal_status`
    - Incluir todas as etapas do Comercial Público
    - Incluir todas as etapas da Petrobras
    - Manter compatibilidade com dados existentes

  2. Novos valores adicionados
    - Etapas específicas para cada departamento
    - Total de 19 valores únicos (removendo duplicatas)

  3. Segurança
    - Valores existentes preservados
    - Adiciona novos valores sem quebrar dados atuais
*/

-- Adicionar novos valores ao ENUM proposal_status
-- Comercial Público
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Desclassificados no início';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Edital não qualificado';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Em negociação';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Lances';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Declinamos/ Não teve pregão';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Desclassificado na planilha';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Inabilitado';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Planilha aceita / Aguardando habilitação';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Habilitado/ Aguardando recurso';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Contrato assinado';

-- Petrobras (valores únicos não duplicados)
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Suspenso';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Encerrado';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Em montagem';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Classificação';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Avaliação de efetividade (avaliação de planilha)';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Habilitação';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Relatório de divulgação';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Abertura de recursos';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'Relatório final / Homologação';
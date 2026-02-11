/*
  # Adicionar campos de notificação à tabela proposals

  1. Novos Campos
    - `email_1h_enviado` (boolean) - Flag para controlar se email de 1 hora foi enviado
    - `email_1d_enviado` (boolean) - Flag para controlar se email de 1 dia foi enviado
    - `observacoes_acao` (text) - Observações sobre a próxima ação (já existe como observacao_proxima_acao)

  2. Alterações
    - Adicionar colunas com valores padrão false para as flags
    - Adicionar índices para otimizar consultas de notificação
*/

-- Adicionar colunas de controle de notificação
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS email_1h_enviado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_1d_enviado boolean DEFAULT false;

-- Adicionar índices para otimizar consultas de notificação
CREATE INDEX IF NOT EXISTS idx_proposals_notification_1h 
ON proposals (data_proxima_acao, email_1h_enviado) 
WHERE data_proxima_acao IS NOT NULL AND email_1h_enviado = false;

CREATE INDEX IF NOT EXISTS idx_proposals_notification_1d 
ON proposals (data_proxima_acao, email_1d_enviado) 
WHERE data_proxima_acao IS NOT NULL AND email_1d_enviado = false;

-- Comentário sobre campo existente
COMMENT ON COLUMN proposals.observacao_proxima_acao IS 'Observações sobre a próxima ação da licitação';
/*
  # Corrigir tipo de serviço nos benefícios

  1. Alterações
    - Remove constraint antiga
    - Atualiza valores 'limpeza' para 'facilities' na tabela config_benefits
    - Adiciona nova constraint CHECK para aceitar os valores corretos

  2. Segurança
    - Operação segura que apenas renomeia valores existentes
    - Não perde dados
*/

-- Remover a constraint antiga primeiro
ALTER TABLE config_benefits 
DROP CONSTRAINT IF EXISTS config_benefits_service_type_check;

-- Atualizar valores de 'limpeza' para 'facilities'
UPDATE config_benefits 
SET service_type = 'facilities' 
WHERE service_type = 'limpeza';

-- Adicionar nova constraint com os valores corretos
ALTER TABLE config_benefits 
ADD CONSTRAINT config_benefits_service_type_check 
CHECK (service_type = ANY (ARRAY['facilities'::text, 'vigilancia'::text]));

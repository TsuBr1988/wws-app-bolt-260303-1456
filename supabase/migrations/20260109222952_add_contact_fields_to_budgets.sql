/*
  # Adicionar campos de contato aos orçamentos

  1. Mudanças
    - Adiciona campo `city_name` (texto, obrigatório) - cidade do projeto
    - Adiciona campo `email` (texto, opcional) - email de contato
    - Adiciona campo `phone` (texto, opcional) - telefone de contato
    - Adiciona campo `address` (texto, opcional) - endereço do projeto
    - Adiciona campo `lead_source` (texto, opcional) - origem do lead

  2. Notas
    - O campo `city` existente é mantido para compatibilidade com ISS
    - O novo campo `city_name` é específico para o local do projeto
*/

-- Adicionar novos campos à tabela budgets
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS city_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- Definir valor padrão para registros existentes
UPDATE budgets
SET city_name = 'AMERICANA'
WHERE city_name IS NULL;

-- Tornar city_name obrigatório após definir valores padrão
ALTER TABLE budgets
ALTER COLUMN city_name SET NOT NULL;
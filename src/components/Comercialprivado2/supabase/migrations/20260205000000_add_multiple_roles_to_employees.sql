/*
  # Adicionar Múltiplos Papéis aos Funcionários

  1. Alterações
    - Adiciona campos `is_closer` e `is_sdr` (boolean) para permitir múltiplos papéis
    - Migra dados existentes do campo `role` para os novos campos
    - Mantém o campo `role` para compatibilidade, mas agora representa o papel "principal"

  2. Notas
    - Um funcionário pode ser tanto Closer quanto SDR ao mesmo tempo
    - Admin continua sendo um papel único
    - Os novos campos são NOT NULL com defaults
*/

-- Adicionar novos campos booleanos para papéis
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS is_closer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_sdr boolean DEFAULT false;

-- Migrar dados existentes
UPDATE employees
SET is_closer = true
WHERE role = 'Closer';

UPDATE employees
SET is_sdr = true
WHERE role = 'SDR';

-- Garantir que todos os funcionários tenham pelo menos um papel
UPDATE employees
SET is_closer = false, is_sdr = false
WHERE role = 'Admin';

-- Comentário explicativo
COMMENT ON COLUMN employees.is_closer IS 'Indica se o funcionário pode atuar como Closer';
COMMENT ON COLUMN employees.is_sdr IS 'Indica se o funcionário pode atuar como SDR';

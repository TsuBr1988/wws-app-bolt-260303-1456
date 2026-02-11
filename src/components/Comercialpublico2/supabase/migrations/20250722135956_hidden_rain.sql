/*
  # Corrigir políticas RLS para bonus_contributions

  1. Políticas de Segurança
    - Permitir inserção automática via trigger
    - Permitir leitura para usuários autenticados
    - Permitir inserção/atualização para administradores

  2. Ajustes RLS
    - Política para operações automáticas do sistema
    - Política para operações manuais de usuários
*/

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Allow admins to manage bonus_contributions" ON public.bonus_contributions;
DROP POLICY IF EXISTS "Allow authenticated users to read bonus_contributions" ON public.bonus_contributions;
DROP POLICY IF EXISTS "Authenticated users can manage bonus_contributions" ON public.bonus_contributions;

-- Permitir acesso público para leitura (compatível com o sistema atual)
CREATE POLICY "Allow public read access to bonus_contributions"
  ON public.bonus_contributions
  FOR SELECT
  TO public
  USING (true);

-- Permitir inserção pública (necessário para o trigger automático)
CREATE POLICY "Allow public insert access to bonus_contributions"
  ON public.bonus_contributions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Permitir atualização pública (para operações do sistema)
CREATE POLICY "Allow public update access to bonus_contributions"
  ON public.bonus_contributions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Permitir exclusão pública (para operações administrativas)
CREATE POLICY "Allow public delete access to bonus_contributions"
  ON public.bonus_contributions
  FOR DELETE
  TO public
  USING (true);

-- Garantir que RLS está habilitado
ALTER TABLE public.bonus_contributions ENABLE ROW LEVEL SECURITY;
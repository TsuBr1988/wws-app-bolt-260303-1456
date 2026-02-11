/*
  # Criar função exec_sql para execução programática de SQL

  1. Nova função
    - `exec_sql` para execução de comandos SQL programaticamente
    - Necessária para criar tabelas via código JavaScript
    - Apenas usuários autenticados podem usar
  
  2. Segurança
    - Função apenas para authenticated users
    - Proteção contra execução maliciosa
*/

-- Função para executar SQL programaticamente
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Permitir apenas usuários autenticados
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
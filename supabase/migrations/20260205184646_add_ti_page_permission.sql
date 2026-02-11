/*
  # Adicionar página TI ao sistema de permissões

  1. Mudanças
    - Cria a página 'ti' no sistema
    - Administradores terão acesso automático através do código (is_admin = true)
    - Futuros indicadores serão adicionados conforme necessário

  2. Notas
    - A permissão será gerenciada através da tabela user_permissions para usuários não-admin
    - Esta migration apenas documenta a existência da página no sistema
*/

-- Esta migration documenta a criação da página TI
-- As permissões são gerenciadas através de user_permissions e user_indicator_permissions
-- Administradores têm acesso automático através do código (useAuth.ts linha 46)

-- Comentário de documentação: Página TI criada e disponível no sistema
SELECT 1; -- Migration completa

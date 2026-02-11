/*
  # Adicionar permissão para página Finanças
  
  1. Alterações
    - Insere a página "financas" na tabela user_permissions
    - Define acesso padrão como true (can_view = true) para todos os usuários existentes
  
  2. Notas
    - A página "Finanças" terá acesso habilitado por padrão
    - Administradores podem modificar as permissões via página de configurações
*/

-- Inserir a nova página "financas" para todos os usuários existentes
INSERT INTO user_permissions (user_id, page, can_view)
SELECT id, 'financas', true
FROM app_users
WHERE NOT EXISTS (
  SELECT 1 FROM user_permissions 
  WHERE user_id = app_users.id AND page = 'financas'
);

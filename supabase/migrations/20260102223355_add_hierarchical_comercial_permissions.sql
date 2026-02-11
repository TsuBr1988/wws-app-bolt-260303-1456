/*
  # Adicionar Permissões Hierárquicas para Comercial Público e Privado

  1. Descrição
    - Adiciona páginas de controle para Comercial Público e Comercial Privado
    - Cada uma dessas páginas funciona como um "card" que pode ser liberado ou bloqueado
    - Dentro de cada card, existem indicadores que representam as abas específicas

  2. Estrutura Hierárquica
    - Nível 1: "comercial_publico" e "comercial_privado" (os cards principais)
    - Nível 2: Abas específicas dentro de cada sistema
    
  3. Comercial Público - Abas:
    - Dashboard
    - Licitações
    - Notificações
    - Contratos
    - Comissões
    - Fundo de Bônus
    - Desafios
    - Certidões
    - Tarefas
    - Orçamentos
    - Configurações

  4. Comercial Privado - Abas:
    - Dashboard
    - Metas Comerciais
    - Propostas
    - Prospecção
    - Marketing
    - Comissões
    - Performance Semanal
    - Fundo de Bônus
    - Funcionário do Mês
    - Desafios
    - Orçamentos
    - Configurações

  5. Funcionamento
    - Se o usuário não tiver permissão no card principal (comercial_publico ou comercial_privado), 
      ele não verá o card na página Comercial
    - Se ele tiver permissão no card mas não em uma aba específica, ele não verá aquela aba
    - As permissões continuam usando o mesmo sistema: none, view, edit
*/

-- Nota: Este é apenas um marcador conceitual. As permissões são controladas dinamicamente
-- através da tabela user_indicator_permissions que já existe.
-- Não é necessário criar nenhuma estrutura adicional no banco de dados.

-- Este arquivo serve para documentar a estrutura de permissões que será implementada
-- no frontend através do componente PermissionsMatrix.

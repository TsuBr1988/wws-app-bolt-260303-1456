/*
  # Atualizar trigger para usar 0,01% ao invés de 0,1%
  
  1. Alterações
    - Função create_bonus_contribution() atualizada para usar 0,01% (0.0001)
    - Trigger recriado com nova lógica
    - Comentários atualizados
*/

-- Remover trigger e função existentes
DROP TRIGGER IF EXISTS create_bonus_contribution_trigger ON proposals;
DROP FUNCTION IF EXISTS create_bonus_contribution();

-- Criar função atualizada com 0,01%
CREATE OR REPLACE FUNCTION create_bonus_contribution()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o status mudou para 'Fechado'
  IF NEW.status = 'Fechado' AND (OLD.status IS NULL OR OLD.status != 'Fechado') THEN
    
    -- Inserir contribuição no fundo de bonificação
    INSERT INTO bonus_contributions (
      proposal_id,
      client_name,
      contract_value,
      fixed_amount,
      percentage_amount
    ) VALUES (
      NEW.id,
      NEW.client,
      NEW.total_value,
      50.00, -- R$ 50 fixo
      (NEW.total_value * 0.0001) -- 0,01% do valor global
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
CREATE TRIGGER create_bonus_contribution_trigger
  AFTER INSERT OR UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION create_bonus_contribution();
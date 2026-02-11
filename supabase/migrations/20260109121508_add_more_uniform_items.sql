/*
  # Adicionar mais uniformes pré-configurados
  
  Adiciona os seguintes uniformes ao catálogo padrão:
  - Jaqueta de frio - R$ 75,00 - Vida útil: 24 meses
  - Cinto - R$ 45,00 - Vida útil: 24 meses
  - Boné/quepe - R$ 36,00 - Vida útil: 12 meses
*/

-- Inserir apenas se não existir
DO $$
BEGIN
  -- Jaqueta de frio
  IF NOT EXISTS (SELECT 1 FROM config_uniforms WHERE name = 'Jaqueta de frio') THEN
    INSERT INTO config_uniforms (name, unit_value, default_amortization, default_quantity, is_active)
    VALUES ('Jaqueta de frio', 75.00, 24, 1, true);
  END IF;

  -- Cinto
  IF NOT EXISTS (SELECT 1 FROM config_uniforms WHERE name = 'Cinto') THEN
    INSERT INTO config_uniforms (name, unit_value, default_amortization, default_quantity, is_active)
    VALUES ('Cinto', 45.00, 24, 1, true);
  END IF;

  -- Boné/quepe
  IF NOT EXISTS (SELECT 1 FROM config_uniforms WHERE name = 'Boné/quepe') THEN
    INSERT INTO config_uniforms (name, unit_value, default_amortization, default_quantity, is_active)
    VALUES ('Boné/quepe', 36.00, 12, 1, true);
  END IF;
END $$;
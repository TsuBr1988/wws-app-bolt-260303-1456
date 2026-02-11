/*
  # Corrigir Dias de Vale Transporte por Escala

  1. Alterações
    - Atualiza coluna `vt_days` com valores corretos por escala
    - VT não é sempre 62 dias, varia conforme a escala de trabalho

  2. Valores Corretos de VT por Escala
    Escala | VT Dias
    12x36 | 62
    2ª a 6ª (12h diária) | 44
    2ª a 6ª (44h) | 44
    2ª a Sábado (44h) | 50
    2ª a Domingo (8h) | 62
*/

-- Atualizar escala 12x36: 62 dias VT
UPDATE budget_work_scales
SET vt_days = 62.00
WHERE scale_name = 'Escala 12x36';

-- Atualizar escala 2ª a 6ª (12h Diária): 44 dias VT
UPDATE budget_work_scales
SET vt_days = 44.00
WHERE scale_name = '2ª a 6ª (12h Diária)';

-- Atualizar escala 2ª a 6ª (44h): 44 dias VT
UPDATE budget_work_scales
SET vt_days = 44.00
WHERE scale_name = '2ª a 6ª (44h)';

-- Atualizar escala 2ª a Sábado (44h): 50 dias VT
UPDATE budget_work_scales
SET vt_days = 50.00
WHERE scale_name = '2ª a Sábado (44h)';

-- Atualizar escala 2ª a Domingo (8h Diária): 62 dias VT
UPDATE budget_work_scales
SET vt_days = 62.00
WHERE scale_name = '2ª a Domingo (8h Diária)';

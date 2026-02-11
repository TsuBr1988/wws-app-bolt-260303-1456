/*
  # Atualizar Escalas com Dias Específicos para Benefícios

  1. Alterações
    - Adiciona coluna `vr_days` (dias de vale refeição/alimentação por mês)
    - Adiciona coluna `vt_days` (dias de vale transporte por mês - sempre 62)
    - Atualiza `working_days` para valores corretos conforme escala

  2. Explicação
    - VR/VA: calculados com base nos dias efetivos de trabalho no mês (vr_days)
    - VT: sempre 62 dias por mês (ida + volta todos os dias = 31 × 2)
    - Demais benefícios: usam o scale_multiplier (quantidade de pessoas)

  3. Valores por Escala
    Escala | Pessoas | Dias trabalho | VR dias | VT dias | Benefícios mult
    12x36 | 2,0 | 31 | 31 | 62 | 2,0
    2ª-6ª 12h | 1,37 | 22 | 22 | 62 | 1,37
    2ª-6ª 44h | 1,0 | 22 | 22 | 62 | 1,0
    2ª-Sáb 44h | 1,0 | 25 | 25 | 62 | 1,0
    2ª-Dom 8h | 1,37 | 31 | 31 | 62 | 1,37
*/

-- Adicionar colunas de dias para benefícios
ALTER TABLE budget_work_scales
ADD COLUMN IF NOT EXISTS vr_days numeric(5,2) DEFAULT 22.00,
ADD COLUMN IF NOT EXISTS vt_days numeric(5,2) DEFAULT 62.00;

-- Atualizar escala 12x36
UPDATE budget_work_scales
SET 
  scale_multiplier = 2.0000,
  working_days = 31.00,
  vr_days = 31.00,
  vt_days = 62.00
WHERE scale_name = 'Escala 12x36';

-- Atualizar escala 2ª a 6ª (12h Diária)
UPDATE budget_work_scales
SET 
  scale_multiplier = 1.3700,
  working_days = 22.00,
  vr_days = 22.00,
  vt_days = 62.00
WHERE scale_name = '2ª a 6ª (12h Diária)';

-- Atualizar escala 2ª a 6ª (44h)
UPDATE budget_work_scales
SET 
  scale_multiplier = 1.0000,
  working_days = 22.00,
  vr_days = 22.00,
  vt_days = 62.00
WHERE scale_name = '2ª a 6ª (44h)';

-- Atualizar escala 2ª a Sábado (44h)
UPDATE budget_work_scales
SET 
  scale_multiplier = 1.0000,
  working_days = 25.00,
  vr_days = 25.00,
  vt_days = 62.00
WHERE scale_name = '2ª a Sábado (44h)';

-- Atualizar escala 2ª a Domingo (8h Diária)
UPDATE budget_work_scales
SET 
  scale_multiplier = 1.3700,
  working_days = 31.00,
  vr_days = 31.00,
  vt_days = 62.00
WHERE scale_name = '2ª a Domingo (8h Diária)';

-- Adicionar comentários
COMMENT ON COLUMN budget_work_scales.vr_days IS
'Dias de vale refeição/alimentação por mês (baseado nos dias efetivos de trabalho)';

COMMENT ON COLUMN budget_work_scales.vt_days IS
'Dias de vale transporte por mês (sempre 62 = 31 dias × 2 viagens por dia)';

/*
  # Adicionar Dias Úteis por Colaborador

  1. Alterações
    - Adiciona coluna `working_days_per_employee` (dias úteis por colaborador)
    - Atualiza `vr_days` para refletir dias por colaborador
    - Mantém `vt_days` como está (dias de VT por pessoa)

  2. Explicação
    - Escala 12x36: 2 pessoas trabalham 15,5 dias cada = 31 dias totais
    - VR é calculado por: valor × dias_por_colaborador × quantidade_pessoas
    - VT é calculado por: valor × dias_vt_por_pessoa × quantidade_pessoas

  3. Valores por Escala
    Escala | Pessoas | Dias Total | Dias/Colab | VR Dias | VT Dias/Pessoa
    12x36 | 2,0 | 31 | 15,5 | 15,5 | 31
    2ª-6ª 12h | 1,37 | 22 | 22 | 22 | 44
    2ª-6ª 44h | 1,0 | 22 | 22 | 22 | 44
    2ª-Sáb 44h | 1,0 | 25 | 25 | 25 | 50
    2ª-Dom 8h | 1,37 | 31 | 31 | 31 | 62
*/

-- Adicionar coluna de dias úteis por colaborador
ALTER TABLE budget_work_scales
ADD COLUMN IF NOT EXISTS working_days_per_employee numeric(5,2);

-- Atualizar escala 12x36
UPDATE budget_work_scales
SET 
  working_days = 31.00,
  working_days_per_employee = 15.50,
  vr_days = 15.50,
  vt_days = 62.00
WHERE scale_name = 'Escala 12x36';

-- Atualizar escala 2ª a 6ª (12h Diária)
UPDATE budget_work_scales
SET 
  working_days = 22.00,
  working_days_per_employee = 22.00,
  vr_days = 22.00,
  vt_days = 44.00
WHERE scale_name = '2ª a 6ª (12h Diária)';

-- Atualizar escala 2ª a 6ª (44h)
UPDATE budget_work_scales
SET 
  working_days = 22.00,
  working_days_per_employee = 22.00,
  vr_days = 22.00,
  vt_days = 44.00
WHERE scale_name = '2ª a 6ª (44h)';

-- Atualizar escala 2ª a Sábado (44h)
UPDATE budget_work_scales
SET 
  working_days = 25.00,
  working_days_per_employee = 25.00,
  vr_days = 25.00,
  vt_days = 50.00
WHERE scale_name = '2ª a Sábado (44h)';

-- Atualizar escala 2ª a Domingo (8h Diária)
UPDATE budget_work_scales
SET 
  working_days = 31.00,
  working_days_per_employee = 31.00,
  vr_days = 31.00,
  vt_days = 62.00
WHERE scale_name = '2ª a Domingo (8h Diária)';

-- Adicionar comentário
COMMENT ON COLUMN budget_work_scales.working_days_per_employee IS
'Dias úteis de trabalho por colaborador. Ex: Escala 12x36 = 15,5 dias por pessoa (total 31 dias / 2 pessoas)';

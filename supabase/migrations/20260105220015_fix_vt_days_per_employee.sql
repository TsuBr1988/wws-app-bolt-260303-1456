/*
  # Corrigir VT para Dias por Colaborador

  1. Correção
    - vt_days deve representar dias de VT POR COLABORADOR
    - Não o total de dias de VT do posto
    - O cálculo multiplica por quantidade de pessoas automaticamente

  2. Valores Corretos (por colaborador)
    Escala | VT/Colaborador | Pessoas | VT Total
    12x36 | 31 | 2,0 | 62
    2ª-6ª 12h | 44 | 1,37 | 60,28 (aproximadamente)
    2ª-6ª 44h | 44 | 1,0 | 44
    2ª-Sáb 44h | 50 | 1,0 | 50
    2ª-Dom 8h | 62 | 1,37 | 84,94 (aproximadamente)
*/

-- Corrigir vt_days para ser por colaborador

-- Escala 12x36: 31 dias por colaborador
UPDATE budget_work_scales
SET vt_days = 31.00
WHERE scale_name = 'Escala 12x36';

-- Escala 2ª a 6ª (12h): 44 dias por colaborador (não muda)
-- já está correto

-- Escala 2ª a Domingo (8h): 62 dias por colaborador (não muda)
-- já está correto

COMMENT ON COLUMN budget_work_scales.vt_days IS
'Dias de vale transporte POR COLABORADOR. Ex: Escala 12x36 = 31 dias/pessoa (total 62 para 2 pessoas)';

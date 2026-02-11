/*
  # Expandir tipos de meta dos desafios

  1. Novos Tipos de Meta
    - Adicionar 'mql', 'visitas_agendadas', 'contratos_assinados' ao enum target_type
    - Permitir métricas específicas da performance semanal
    
  2. Compatibilidade
    - Manter tipos existentes ('points', 'sales')
    - Atualização sem quebrar dados existentes
*/

-- Atualizar o enum target_type para incluir as novas opções
ALTER TYPE target_type ADD VALUE IF NOT EXISTS 'mql';
ALTER TYPE target_type ADD VALUE IF NOT EXISTS 'visitas_agendadas';  
ALTER TYPE target_type ADD VALUE IF NOT EXISTS 'contratos_assinados';
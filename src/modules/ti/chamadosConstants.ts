export const CHAMADO_TIPOS = ['Estrutural', 'Melhoria', 'Correção'] as const;
export type ChamadoTipo = (typeof CHAMADO_TIPOS)[number];

export const CHAMADO_PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Crítica'] as const;
export type ChamadoPrioridade = (typeof CHAMADO_PRIORIDADES)[number];

// DB stores 'A fazer'; UI label should be 'Fazer'
export const CHAMADO_STATUS = ['A fazer', 'Fazendo', 'Feito'] as const;
export type ChamadoStatus = (typeof CHAMADO_STATUS)[number];

export const getChamadoStatusLabel = (status: string): string => {
  if (status === 'A fazer') return 'Fazer';
  return status;
};

export const CHAMADO_MODULOS = [
  'Home',
  'RH',
  'Operacional',
  'Comercial Público',
  'Comercial Privado',
  'Compras',
  'Finanças',
  'Qualidade',
  'Contratos',
  'Cultura',
  'Atas e Ações',
  'TI',
] as const;

export type ChamadoModulo = (typeof CHAMADO_MODULOS)[number];

export const CHAMADO_ESTIMATIVAS = [1, 2, 3, 5, 8] as const;
export type ChamadoEstimativa = (typeof CHAMADO_ESTIMATIVAS)[number];

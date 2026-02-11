export const STATUS_OPTIONS = [
  'Aguardando',
  'Em andamento',
  'Encerrado',
  'Contrato assinado',
  'Perdido',
  'Desclassificado',
  'Suspenso',
  'Vencido',
  'Fracassado',
  'Inabilitado',
  'Revogado',
  'Declinamos',
] as const;

export type ProposalStatus = typeof STATUS_OPTIONS[number];

export const STATUS_POSSIVEL_COMISSAO: ProposalStatus[] = [
  'Aguardando',
  'Em andamento',
];

export const STATUS_VENCEU_CONTRATO: ProposalStatus[] = [
  'Contrato assinado',
];

export const STATUS_PERDIDOS: ProposalStatus[] = [
  'Encerrado',
  'Perdido',
  'Desclassificado',
  'Suspenso',
  'Vencido',
  'Fracassado',
  'Inabilitado',
  'Revogado',
  'Declinamos',
];

// Cores (Tailwind) para o BADGE/SELECT da situação
export const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  'Aguardando':        { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  'Em andamento':      { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200'  },
  'Contrato assinado': { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200'   },
  'default':           { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200'    },
};

// Ranking para ordenação padrão
export const STATUS_ORDER_RANK: Record<string, number> = {
  'Em andamento': 1,
  'Aguardando': 2,
  'Contrato assinado': 3,
  // qualquer outro status
  'default': 99,
};

// Funções utilitárias para filtros
export function isPossivelComissao(status: ProposalStatus): boolean {
  return STATUS_POSSIVEL_COMISSAO.includes(status);
}

export function isContratoAssinado(status: ProposalStatus): boolean {
  return STATUS_VENCEU_CONTRATO.includes(status);
}

export function isStatusPerdido(status: ProposalStatus): boolean {
  return STATUS_PERDIDOS.includes(status);
}

// Função para obter cores da situação
export function getSituacaoColor(situacao: string) {
  const colors = STATUS_COLOR_MAP[situacao] ?? STATUS_COLOR_MAP.default;
  return `${colors.bg} ${colors.text} ${colors.border}`;
}

// Função para obter ranking da situação para ordenação
export function getStatusRank(status: string): number {
  return STATUS_ORDER_RANK[status] ?? STATUS_ORDER_RANK.default;
}
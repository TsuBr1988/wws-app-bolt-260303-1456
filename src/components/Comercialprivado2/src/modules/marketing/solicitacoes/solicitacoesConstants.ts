import type {
  MarketingSolicitacaoDepartamento,
  MarketingSolicitacaoPontos,
  MarketingSolicitacaoPrioridade,
  MarketingSolicitacaoStatus,
  MarketingSolicitacaoTipo,
} from './types';

export const SOLICITACAO_TIPOS: MarketingSolicitacaoTipo[] = [
  'Postagens',
  'Materiais Físicos',
  'Materiais Digitais',
];

export const SOLICITACAO_PRIORIDADES: MarketingSolicitacaoPrioridade[] = [
  'Baixa',
  'Média',
  'Alta',
  'Crítica',
];

export const SOLICITACAO_STATUS: MarketingSolicitacaoStatus[] = ['A fazer', 'Fazendo', 'Feito', 'Refação'];

export const SOLICITACAO_PONTOS: MarketingSolicitacaoPontos[] = [1, 2, 3, 5, 8];

export const SOLICITACAO_DEPARTAMENTOS: MarketingSolicitacaoDepartamento[] = [
  'RH',
  'Comercial Privado',
  'Comercial Público',
  'Compras',
  'TI',
  'Marketing',
  'Qualidade',
  'Financeiro',
  'Operacional',
];

export type MarketingRole = 'editor';

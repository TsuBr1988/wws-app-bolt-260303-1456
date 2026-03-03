export type SolicitarViewState = 'solicitacoes';

export type MarketingSolicitacaoTipo = 'Postagens' | 'Materiais Físicos' | 'Materiais Digitais';

export type MarketingSolicitacaoPrioridade = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type MarketingSolicitacaoStatus = 'A fazer' | 'Fazendo' | 'Feito' | 'Refação';

export type MarketingSolicitacaoDepartamento =
  | 'RH'
  | 'Comercial Privado'
  | 'Comercial Público'
  | 'Compras'
  | 'TI'
  | 'Marketing'
  | 'Qualidade'
  | 'Financeiro'
  | 'Operacional';

export type MarketingSolicitacaoPontos = 1 | 2 | 3 | 5 | 8;

export interface SolicitacaoHistoricoItem {
  at: string;
  action:
    | 'comentario'
    | 'fazer'
    | 'feito'
    | 'refazer'
    | 'reabrir'
    | 'concluir'
    | 'arquivar'
    | 'editar'
    | 'status';
  comment?: string;
  by_name?: string;
  by_email?: string;
  from_status?: MarketingSolicitacaoStatus;
  to_status?: MarketingSolicitacaoStatus;
}

export interface Solicitacao {
  id: string;
  solicitacao_numero: number;
  titulo: string;
  descricao: string;
  tipo: MarketingSolicitacaoTipo;
  departamento: MarketingSolicitacaoDepartamento;
  prioridade: MarketingSolicitacaoPrioridade;
  pontos?: MarketingSolicitacaoPontos | null;
  status: MarketingSolicitacaoStatus;
  solicitante_nome: string;
  solicitante_email: string;
  data_abertura: string;
  data_inicio?: string | null;
  data_conclusao?: string | null;
  historico?: SolicitacaoHistoricoItem[] | null;
  arquivado?: boolean | null;
  data_arquivamento?: string | null;
  created_at: string;
  updated_at: string;
}

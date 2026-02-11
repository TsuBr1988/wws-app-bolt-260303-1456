export type ViewState = 'chamados';

export interface ChamadoHistoricoItem {
  at: string;
  action: 'comentario' | 'fazer' | 'feito' | 'refazer' | 'reabrir' | 'concluir' | 'arquivar' | 'editar' | 'status';
  comment?: string;
  by_name?: string;
  by_email?: string;
  from_status?: Chamado['status'];
  to_status?: Chamado['status'];
}

export interface Chamado {
  id: string;
  chamado_numero: number;
  titulo: string;
  descricao: string;
  tipo: 'Estrutural' | 'Melhoria' | 'Correção';
  modulo: string;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  estimativa?: 1 | 2 | 3 | 5 | 8 | null;
  categoria: 'Hardware' | 'Software' | 'Rede' | 'Acesso' | 'Email' | 'Telefonia' | 'Impressora' | 'Outros';
  status: 'A fazer' | 'Fazendo' | 'Feito';
  solicitante_nome: string;
  solicitante_email: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  data_abertura: string;
  data_inicio?: string;
  data_conclusao?: string;
  prazo_estimado?: string;
  observacoes?: string;
  historico?: ChamadoHistoricoItem[];
  arquivado?: boolean;
  data_arquivamento?: string;
  created_at: string;
  updated_at: string;
}

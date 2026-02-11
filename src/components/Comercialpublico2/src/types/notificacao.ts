export type SituacaoNotificacao = 'A fazer' | 'Feito' | 'Não iremos responder';

export interface Notificacao {
  id: string;
  cliente: string;
  assunto: string;
  detalhes: string | null;
  data_recebimento: string; // ISO string
  data_limite: string;      // ISO string
  situacao: SituacaoNotificacao;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface NotificacaoFormData {
  cliente: string;
  assunto: string;
  detalhes?: string | null;
  data_recebimento: string; // ISO
  data_limite: string;      // ISO
  situacao: SituacaoNotificacao;
}
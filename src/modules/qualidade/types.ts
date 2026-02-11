export type QualidadeViewState =
  | 'politica'
  | 'contextos'
  | 'riscos'
  | 'documentos'
  | 'processos'
  | 'procedimentos'
  | 'rnc'
  | 'pesquisa'
  | 'mudancas'
  | 'propriedade'
  | 'ata';

export interface PoliticaQualidade {
  id: string;
  titulo: string;
  conteudo: string;
  data_aprovacao: Date;
  versao: string;
  created_at: Date;
  updated_at: Date;
}

export interface ContextoParteInteressada {
  id: string;
  tipo: 'interno' | 'externo';
  nome: string;
  descricao: string;
  necessidades: string;
  expectativas: string;
  created_at: Date;
  updated_at: Date;
}

export interface RiscoOportunidade {
  id: string;
  tipo: 'risco' | 'oportunidade';
  descricao: string;
  processo_relacionado: string;
  probabilidade: 1 | 2 | 3 | 4 | 5;
  impacto: 1 | 2 | 3 | 4 | 5;
  nivel_risco: number;
  acoes_tratamento: string;
  responsavel: string;
  prazo: Date;
  status: 'aberto' | 'em_andamento' | 'concluido' | 'cancelado';
  created_at: Date;
  updated_at: Date;
}

export interface InformacaoDocumentada {
  id: string;
  codigo: string;
  titulo: string;
  tipo: 'procedimento' | 'instrucao' | 'formulario' | 'registro' | 'manual' | 'outro';
  versao: string;
  data_emissao: Date;
  data_revisao?: Date;
  status: 'ativo' | 'obsoleto' | 'em_revisao';
  responsavel: string;
  local_armazenamento: string;
  arquivo_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MapaProcesso {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'estrategico' | 'operacional' | 'apoio';
  descricao: string;
  responsavel: string;
  entrada: string;
  saida: string;
  recursos: string;
  indicadores: string;
  diagrama_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RNC {
  id: string;
  numero: string;
  data_identificacao: Date;
  tipo: 'produto' | 'processo' | 'sistema';
  origem: 'auditoria_interna' | 'auditoria_externa' | 'cliente' | 'processo' | 'outro';
  descricao_nao_conformidade: string;
  processo_relacionado: string;
  identificado_por: string;
  analise_causa_raiz: string;
  acao_corretiva: string;
  responsavel: string;
  prazo_conclusao: Date;
  status: 'aberta' | 'em_analise' | 'em_acao' | 'verificacao' | 'fechada';
  data_conclusao?: Date;
  verificacao_eficacia: string;
  created_at: Date;
  updated_at: Date;
}

export interface PesquisaSatisfacao {
  id: string;
  data_pesquisa: Date;
  cliente: string;
  tipo: 'produto' | 'servico' | 'geral';
  pergunta_1: string;
  resposta_1: number;
  pergunta_2: string;
  resposta_2: number;
  pergunta_3: string;
  resposta_3: number;
  pergunta_4: string;
  resposta_4: number;
  pergunta_5: string;
  resposta_5: number;
  media_geral: number;
  comentarios?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ControleMudanca {
  id: string;
  numero: string;
  data_solicitacao: Date;
  solicitante: string;
  tipo_mudanca: 'processo' | 'produto' | 'sistema' | 'documentacao' | 'outro';
  descricao: string;
  justificativa: string;
  impactos_identificados: string;
  analise_risco: string;
  aprovador: string;
  data_aprovacao?: Date;
  status: 'solicitada' | 'em_analise' | 'aprovada' | 'rejeitada' | 'implementada';
  data_implementacao?: Date;
  responsavel_implementacao: string;
  verificacao_eficacia: string;
  created_at: Date;
  updated_at: Date;
}

export interface PropriedadeTerceiros {
  id: string;
  numero_controle: string;
  proprietario: string;
  tipo: 'equipamento' | 'ferramenta' | 'documento' | 'material' | 'informacao' | 'outro';
  descricao: string;
  numero_serie?: string;
  data_recebimento: Date;
  local_armazenamento: string;
  responsavel_custodia: string;
  condicao: 'bom' | 'regular' | 'danificado' | 'extraviado';
  data_devolucao?: Date;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AtaAnaliseCritica {
  id: string;
  numero: string;
  data_reuniao: Date;
  participantes: string[];
  desempenho_processos: string;
  adequacao_politica: string;
  adequacao_objetivos: string;
  resultados_auditorias: string;
  feedback_clientes: string;
  situacao_riscos: string;
  recursos_necessarios: string;
  oportunidades_melhoria: string;
  mudancas_necessarias: string;
  decisoes_tomadas: string;
  acoes_acompanhamento: string;
  responsaveis: string;
  prazos: string;
  proxima_reuniao: Date;
  created_at: Date;
  updated_at: Date;
}

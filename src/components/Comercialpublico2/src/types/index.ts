export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  position: string;
  points: number;
  level: number;
  badges: Badge[];
  role: 'ADL' | 'Licitante' | 'Admin' | 'Promotor' | 'Orcamentista';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  targetPoints: number;
  participants: number;
  status: 'active' | 'paused' | 'completed';
  rewards: Reward[];
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  category: string;
  image: string;
  stock: number;
  isAvailable: boolean;
}

export interface Recognition {
  id: string;
  fromEmployee: Employee;
  toEmployee: Employee;
  message: string;
  points: number;
  timestamp: string;
  isPublic: boolean;
}

export interface DashboardStats {
  totalPoints: number;
  activeParticipants: number;
  completedCampaigns: number;
  engagementRate: number;
}

export interface ProbabilityScores {
  requisitosHabilitacao: number;
  processoContratacao: number;
  plataforma: number;
  posturaPregoeiro: number;
  planilhaPreco: number;
  modeloPlanilha: number;
  influencia: number;
  requisitosdiferenciacao: number;
  posicaoAposLances: number;
}

export interface Licitacao {
  id: string;
  orgao: string;
  cidade?: string;
  numeroPregao: string;
  plataforma: string;
  dataInclusao: string;
  dataPregao: string;
  dataPregao: string; // Combined date and time - NOVO CAMPO CORRETO
  dataProximaAcao?: string;
  empresa: 'WWS' | 'Worldwide';
  situacao: 'Aguardando' | 'Desclassificado' | 'Em andamento' | 'Encerrado' | 'Declinamos' | 'Suspenso' | 'Vencido' | 'Fracassado' | 'Inabilitado' | 'Perdido' | 'Revogado';
  etapaMaxima: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado';
  valorEstimado?: number;
  empresaVencedora?: string;
  lanceVencedor?: number;
  percentualVencedor?: number | string;
  nossoLance?: number;
  percentualNossoLance?: number | string;
  margemLucro?: number;
  margemAdm?: number;
  posicaoAtual?: string;
  colocacaoAtual?: string;
  months: number;
  statusPlanilha: 'Planilha a fazer' | 'Planilha feita';
  observacoes?: string;
  licitanteId: string;
  adlId?: string;
  promotorId?: string;
  orcamentistaId?: string;
  probabilityScores?: ProbabilityScores;
  dataAssinatura?: string; // Data oficial de assinatura do contrato
  createdAt: string;
  updatedAt: string;
  observacaoProximaAcao?: string; // Observações sobre a próxima ação
  proximaAcaoTexto?: string; // Texto livre para detalhes da próxima ação
  nao_gera_comissao?: boolean; // Não gera comissão nem conta para meta comercial
  nao_conta_meta_comercial?: boolean; // Não conta para meta comercial (mas gera comissão)
}

// Manter interface Proposal para compatibilidade com outras partes do sistema
export interface Proposal extends Licitacao {
  client: string;
  city?: string;
  monthlyValue: number;
  months: number;
  totalValue: number;
  status: string;
  commission: number;
  commissionRate: number;
  closerId: string;
  sdrId?: string;
  proposalDate?: string;
  closingDate?: string;
  lostDate?: string;
  lostReason?: string;
}
export interface CloserStats {
  id: string;
  name: string;
  monthlyTarget: number;
  currentMonthSales: number;
  totalCommission: number;
  proposals: Proposal[];
}

export interface SDRStats {
  id: string;
  name: string;
  weeklyTarget: number;
  currentWeekAppointments: number;
  monthlyAppointments: number;
  totalCommission: number;
}

// Re-export notificação types
export * from './notificacao';

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  rewardAmount: string;
  targetType: 'points' | 'sales' | 'monthly_value' | 'mql' | 'visitas_agendadas' | 'contratos_assinados' | 'pontos_educacao';
  targetValue: number;
  status: 'active' | 'completed' | 'expired';
  participantsIds?: string[];
  winnerIds?: string[];
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BonusFund {
  totalAmount: number;
  contributions: BonusContribution[];
  employees: BonusEmployee[];
}

export interface BonusContribution {
  id: string;
  proposalId: string;
  clientName: string;
  contractValue: number;
  fixedAmount: number; // R$ 50
  percentageAmount: number; // 0.01% do valor
  totalContribution: number;
  date: string;
}

export interface BonusEmployee {
  id: string;
  name: string;
  avatar: string;
  startDate: string;
  monthsWorked: number;
  projectedBonus: number;
}

export interface WeeklyMetric {
  id: string;
  name: string;
  points: number;
}

export interface WeeklyData {
  employeeId: string;
  weekEndingDate: string; // Data da sexta-feira
  metrics: {
    tarefas: number;
    pontosEducacao: number;
    propostasApresentadas: number;
    contratoAssinado: number;
    mql: number;
    visitasAgendadas: number;
  };
  totalPoints: number;
}

export interface WeeklyPerformance {
  weeks: string[]; // Datas das sextas-feiras
  employeeData: WeeklyData[];
}
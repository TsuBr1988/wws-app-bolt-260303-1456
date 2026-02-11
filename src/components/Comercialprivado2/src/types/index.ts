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
  role: 'SDR' | 'Closer' | 'Admin';
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
  economicBuyer: number;
  metrics: number;
  decisionCriteria: number;
  decisionProcess: number;
  identifyPain: number;
  champion: number;
  competition: number;
  engagement: number;
}

export interface Proposal {
  id: string;
  client: string;
  monthlyValue: number;
  months: number;
  totalValue: number;
  status: 'SQL' | 'Proposta' | 'Negociação' | 'Análise de contrato' | 'Fechado' | 'Perdido';
  commission: number;
  commissionRate: number;
  closerId: string;
  sdrId?: string;
  margemPercentual?: number; // Margem percentual da proposta
  cidade?: string; // Cidade da proposta
  probabilityScores?: ProbabilityScores;
  proposalDate?: string; // Data da proposta (pode ser diferente da criação)
  closingDate?: string; // Data de fechamento (quando status = "Fechado")
  lostDate?: string; // Data que perdemos (quando status = "Perdido")
  lostReason?: 'Fechou com o atual' | 'Fechou com concorrente' | 'Desistiu da contratação';
  createdAt: string;
  updatedAt: string;
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

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  prize: string;
  targetType: 'points' | 'sales' | 'mql' | 'visitas_agendadas' | 'contratos_assinados' | 'pontos_educacao';
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
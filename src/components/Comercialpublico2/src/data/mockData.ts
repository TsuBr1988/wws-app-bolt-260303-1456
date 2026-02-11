import { Employee, Campaign, Reward, Recognition, DashboardStats, Proposal, CloserStats, SDRStats } from '../types';
import { BonusFund, BonusContribution, BonusEmployee } from '../types';

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'André Silva',
    email: 'andre.silva@empresa.com',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    department: 'Vendas',
    position: 'Licitante',
    points: 2850,
    level: 5,
    role: 'Licitante',
    badges: [
      { id: '1', name: 'Top Closer', icon: 'trophy', color: 'bg-yellow-500', description: 'Melhor closer do mês' },
      { id: '2', name: 'Meta Batida', icon: 'target', color: 'bg-green-500', description: 'Meta mensal atingida' }
    ]
  },
  {
    id: '2',
    name: 'Andressa Cordeiro',
    email: 'andressa.cordeiro@empresa.com',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    department: 'Vendas',
    position: 'ADL',
    points: 1340,
    level: 3,
    role: 'ADL',
    badges: [
      { id: '3', name: 'Agendador Pro', icon: 'calendar', color: 'bg-blue-500', description: 'Excelente em agendamentos' }
    ]
  },
  {
    id: '3',
    name: 'Pedro Domingues',
    email: 'pedro.domingues@empresa.com',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    department: 'Vendas',
    position: 'ADL',
    points: 980,
    level: 2,
    role: 'ADL',
    badges: [
      { id: '4', name: 'Persistente', icon: 'zap', color: 'bg-purple-500', description: 'Nunca desiste' }
    ]
  }
];

export const mockProposals: Proposal[] = [
  // Array vazio - dados serão inseridos pelo usuário
];

export const mockCloserStats: CloserStats[] = [
  {
    id: '1',
    name: 'André Silva',
    monthlyTarget: 25000,
    currentMonthSales: 48000,
    totalCommission: 9552,
    proposals: mockProposals
  }
];

export const mockSDRStats: SDRStats[] = [
  {
    id: '2',
    name: 'Andressa Cordeiro',
    weeklyTarget: 3,
    currentWeekAppointments: 4,
    monthlyAppointments: 12,
    totalCommission: 9552 // Same as closer commission now
  },
  {
    id: '3',
    name: 'Pedro Domingues',
    weeklyTarget: 3,
    currentWeekAppointments: 2,
    monthlyAppointments: 8,
    totalCommission: 7200 // Same as closer commission now
  }
];

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Campanha de Vendas Q1',
    description: 'Incentive para aumentar as vendas no primeiro trimestre',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    targetPoints: 5000,
    participants: 25,
    status: 'active',
    rewards: []
  }
];

export const mockRewards: Reward[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    description: 'Último modelo do iPhone com 256GB',
    points: 5000,
    category: 'Tecnologia',
    image: 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
    stock: 5,
    isAvailable: true
  }
];

export const mockRecognitions: Recognition[] = [
  {
    id: '1',
    fromEmployee: mockEmployees[1],
    toEmployee: mockEmployees[0],
    message: 'Excelente fechamento! Sua técnica de vendas é impressionante.',
    points: 100,
    timestamp: '2025-01-15T10:30:00Z',
    isPublic: true
  }
];

export const mockDashboardStats: DashboardStats = {
  totalPoints: 45280,
  activeParticipants: 48,
  completedCampaigns: 12,
  engagementRate: 87.5
};

// Calcular contribuições do fundo baseado nas propostas fechadas
const closedProposals: Proposal[] = []; // Sem propostas fechadas inicialmente
const bonusContributions: BonusContribution[] = closedProposals.map(proposal => {
  const fixedAmount = 50;
  const percentageAmount = proposal.totalValue * 0.0001; // 0.01%
  const totalContribution = fixedAmount + percentageAmount;
  
  return {
    id: `bonus-${proposal.id}`,
    proposalId: proposal.id,
    clientName: proposal.client,
    contractValue: proposal.totalValue,
    fixedAmount,
    percentageAmount,
    totalContribution,
    date: proposal.updatedAt
  };
});

const totalFundAmount = bonusContributions.reduce((sum, contrib) => sum + contrib.totalContribution, 0);

// Calcular bonificação projetada para cada funcionário
const bonusEmployees: BonusEmployee[] = mockEmployees.map(employee => {
  // Simular data de entrada (para exemplo, vamos usar datas diferentes)
  const startDates = {
    '1': '2023-01-15', // André - 12+ meses
    '2': '2023-06-01', // Carlos - 7 meses
    '3': '2023-09-15'  // Maria - 4 meses
  };
  
  const startDate = startDates[employee.id as keyof typeof startDates] || '2024-01-01';
  const monthsWorked = Math.max(1, Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)));
  
  return {
    id: employee.id,
    name: employee.name,
    avatar: employee.avatar,
    startDate,
    monthsWorked,
    projectedBonus: 0 // Will be calculated after array initialization
  };
});

// Recalcular com os valores corretos
const totalMonthsAllEmployees = bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0);
bonusEmployees.forEach(employee => {
  employee.projectedBonus = totalFundAmount > 0 ? (employee.monthsWorked / totalMonthsAllEmployees) * totalFundAmount : 0;
});

export const mockBonusFund: BonusFund = {
  totalAmount: totalFundAmount,
  contributions: bonusContributions,
  employees: bonusEmployees
};
import { ProbabilityScores } from '../components/Licitacoes/ProbabilityModal';
import { getSituacaoColor } from '../constants/status';

// Re-exportar da nova localização
export { getSituacaoColor };

export const getStatusPlanilhaColor = (statusPlanilha: string) => {
  switch (statusPlanilha) {
    case 'Planilha feita': return 'bg-green-100 text-green-800 border-green-200';
    case 'Planilha a fazer': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getProbabilityDisplay = (probabilityScores?: ProbabilityScores) => {
  if (!probabilityScores) {
    return { level: 'Não avaliada', color: 'text-gray-500', bgColor: 'bg-gray-100 border-gray-300' };
  }
  
  const total = Object.values(probabilityScores).reduce((sum, score) => sum + (score || 0), 0);
  
  if (total < 15) return { level: 'Baixa', color: 'text-red-600', bgColor: 'bg-red-100 border-red-300' };
  if (total <= 21) return { level: 'Média', color: 'text-yellow-600', bgColor: 'bg-yellow-100 border-yellow-300' };
  return { level: 'Alta', color: 'text-green-600', bgColor: 'bg-green-100 border-green-300' };
};
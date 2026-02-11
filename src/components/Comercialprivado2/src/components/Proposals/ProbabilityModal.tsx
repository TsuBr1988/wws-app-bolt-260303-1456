import React, { useState } from 'react';
import { X, Info } from 'lucide-react';

interface ProbabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scores: ProbabilityScores) => void;
  currentScores?: ProbabilityScores;
  clientName: string;
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

const criteria = [
  {
    key: 'economicBuyer' as keyof ProbabilityScores,
    title: 'Economic Buyer (Tomador de Decisão)',
    description: 'Identificação e acesso ao verdadeiro tomador de decisão',
    levels: {
      1: 'Não identificado ou sem acesso',
      2: 'Identificado mas acesso limitado',
      3: 'Identificado e com acesso direto'
    }
  },
  {
    key: 'metrics' as keyof ProbabilityScores,
    title: 'Metrics (Objetivos)',
    description: 'Clareza sobre os objetivos e métricas do cliente',
    levels: {
      1: 'Objetivos vagos ou desconhecidos',
      2: 'Objetivos parcialmente definidos',
      3: 'Objetivos claros e mensuráveis'
    }
  },
  {
    key: 'decisionCriteria' as keyof ProbabilityScores,
    title: 'Decision Criteria',
    description: 'Critérios de decisão do cliente',
    levels: {
      1: 'Critérios desconhecidos',
      2: 'Alguns critérios identificados',
      3: 'Todos os critérios mapeados'
    }
  },
  {
    key: 'decisionProcess' as keyof ProbabilityScores,
    title: 'Decision Process',
    description: 'Processo de tomada de decisão',
    levels: {
      1: 'Processo desconhecido',
      2: 'Processo parcialmente mapeado',
      3: 'Processo totalmente mapeado'
    }
  },
  {
    key: 'identifyPain' as keyof ProbabilityScores,
    title: 'Identify Pain',
    description: 'Identificação das dores e necessidades',
    levels: {
      1: 'Dores superficiais ou genéricas',
      2: 'Algumas dores específicas identificadas',
      3: 'Dores críticas bem mapeadas'
    }
  },
  {
    key: 'champion' as keyof ProbabilityScores,
    title: 'Champion/Influenciador',
    description: 'Presença de um defensor interno',
    levels: {
      1: 'Sem champion identificado',
      2: 'Champion identificado mas neutro',
      3: 'Champion ativo e influente'
    }
  },
  {
    key: 'competition' as keyof ProbabilityScores,
    title: 'Competition',
    description: 'Conhecimento sobre a concorrência',
    levels: {
      1: 'Concorrência desconhecida',
      2: 'Alguns concorrentes identificados',
      3: 'Cenário competitivo mapeado'
    }
  },
  {
    key: 'engagement' as keyof ProbabilityScores,
    title: 'Engagement',
    description: 'Nível de engajamento do cliente',
    levels: {
      1: 'Baixo engajamento',
      2: 'Engajamento moderado',
      3: 'Alto engajamento'
    }
  }
];

export const ProbabilityModal: React.FC<ProbabilityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentScores,
  clientName
}) => {
  const [scores, setScores] = useState<ProbabilityScores>(
    currentScores || {
      economicBuyer: 1,
      metrics: 1,
      decisionCriteria: 1,
      decisionProcess: 1,
      identifyPain: 1,
      champion: 1,
      competition: 1,
      engagement: 1
    }
  );

  // Atualizar scores quando currentScores mudar
  React.useEffect(() => {
    if (currentScores) {
      setScores(currentScores);
    }
  }, [currentScores]);
  if (!isOpen) return null;

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  const getProbabilityLevel = (total: number) => {
    if (total < 12) return { level: 'Baixa', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (total <= 18) return { level: 'Média', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'Alta', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const probability = getProbabilityLevel(totalScore);

  const handleScoreChange = (criterion: keyof ProbabilityScores, value: number) => {
    setScores(prev => ({ ...prev, [criterion]: value }));
  };

  const handleSave = () => {
    console.log('Salvando avaliação de probabilidade:', {
      scores,
      totalScore,
      probabilityLevel: probability.level
    });
    onSave(scores);
    
    // Não fechar imediatamente - deixar o componente pai controlar
    // onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Avaliação de Probabilidade</h2>
            <p className="text-gray-600">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Score Summary */}
          <div className={`mb-6 p-4 rounded-lg border-2 ${probability.bgColor} ${
            probability.level === 'Baixa' ? 'border-red-200' :
            probability.level === 'Média' ? 'border-yellow-200' :
            'border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Probabilidade Atual</h3>
                <p className="text-sm text-gray-600">Pontuação total: {totalScore}/24</p>
              </div>
              <div className={`text-2xl font-bold ${probability.color}`}>
                {probability.level}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              <strong>Cálculo:</strong> {Object.entries(scores).map(([key, value]) => `${value}`).join(' + ')} = {totalScore} pontos
            </div>
          </div>

          {/* Criteria Assessment */}
          <div className="space-y-6">
            {criteria.map((criterion) => (
              <div key={criterion.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{criterion.title}</h4>
                    <p className="text-sm text-gray-600">{criterion.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Info className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Nota: {scores[criterion.key]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[1, 2, 3].map((level) => (
                    <label
                      key={level}
                      className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        scores[criterion.key] === level
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={criterion.key}
                        value={level}
                        checked={scores[criterion.key] === level}
                        onChange={() => handleScoreChange(criterion.key, level)}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          scores[criterion.key] === level
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {scores[criterion.key] === level && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Nível {level} ({level} ponto{level > 1 ? 's' : ''})</div>
                          <div className="text-sm text-gray-600">
                            {criterion.levels[level as keyof typeof criterion.levels]}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Probability Scale */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Escala de Probabilidade</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-2 bg-red-100 rounded">
                <div className="font-medium text-red-800">Baixa</div>
                <div className="text-red-600">Soma &lt; 12</div>
              </div>
              <div className="text-center p-2 bg-yellow-100 rounded">
                <div className="font-medium text-yellow-800">Média</div>
                <div className="text-yellow-600">Soma 12-18</div>
              </div>
              <div className="text-center p-2 bg-green-100 rounded">
                <div className="font-medium text-green-800">Alta</div>
                <div className="text-green-600">Soma &gt; 18</div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Salvar Avaliação
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
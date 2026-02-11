import React, { useState } from 'react';
import { X, Info } from 'lucide-react';

interface ProbabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scores: ProbabilityScores) => void;
  currentScores?: ProbabilityScores;
  orgaoName: string;
}

export interface ProbabilityScores {
  requisitos_habilitacao: number;
  processo_contratacao: number;
  plataforma: number;
  postura_pregoeiro: number;
  planilha_preco: number;
  modelo_planilha: number;
  influencia: number;
  requisitos_diferenciacao: number;
  posicao_apos_lances: number;
}

const criteria = [
  {
    key: 'requisitos_habilitacao' as keyof ProbabilityScores,
    title: 'Requisitos de Habilitação - Edital',
    description: 'Atendimento aos requisitos de habilitação descritos no edital',
    levels: {
      1: 'Requisitos complexos ou não atendemos',
      2: 'Alguns requisitos em análise',
      3: 'Todos os requisitos atendidos'
    }
  },
  {
    key: 'processo_contratacao' as keyof ProbabilityScores,
    title: 'Processo de Contratação',
    description: 'Entendimento do processo de contratação do órgão',
    levels: {
      1: 'Processo desconhecido ou complexo',
      2: 'Processo parcialmente conhecido',
      3: 'Processo bem conhecido e familiar'
    }
  },
  {
    key: 'plataforma' as keyof ProbabilityScores,
    title: 'Plataforma',
    description: 'Familiaridade com a plataforma do pregão',
    levels: {
      1: 'Plataforma desconhecida',
      2: 'Pouca experiência na plataforma',
      3: 'Plataforma conhecida e dominada'
    }
  },
  {
    key: 'postura_pregoeiro' as keyof ProbabilityScores,
    title: 'Postura do Pregoeiro',
    description: 'Conhecimento sobre a postura e estilo do pregoeiro',
    levels: {
      1: 'Pregoeiro desconhecido ou rígido',
      2: 'Algum conhecimento sobre o pregoeiro',
      3: 'Pregoeiro conhecido e favorável'
    }
  },
  {
    key: 'planilha_preco' as keyof ProbabilityScores,
    title: 'Planilha e Preço',
    description: 'Competitividade da nossa planilha e preço',
    levels: {
      1: 'Preço alto ou planilha complexa',
      2: 'Preço competitivo mas com ressalvas',
      3: 'Preço muito competitivo e planilha adequada'
    }
  },
  {
    key: 'modelo_planilha' as keyof ProbabilityScores,
    title: 'Modelo de Planilha',
    description: 'Adequação do modelo de planilha exigido',
    levels: {
      1: 'Modelo complexo ou inadequado',
      2: 'Modelo padrão com algumas adaptações',
      3: 'Modelo simples e familiar'
    }
  },
  {
    key: 'influencia' as keyof ProbabilityScores,
    title: 'Influência',
    description: 'Relacionamento e influência junto ao órgão',
    levels: {
      1: 'Sem relacionamento ou influência',
      2: 'Algum relacionamento estabelecido',
      3: 'Bom relacionamento e influência'
    }
  },
  {
    key: 'requisitos_diferenciacao' as keyof ProbabilityScores,
    title: 'Requisitos de Diferenciação',
    description: 'Possuímos algum diferencial competitivo?',
    levels: {
      1: 'Sem diferenciais relevantes',
      2: 'Alguns diferenciais menores',
      3: 'Diferenciais significativos'
    }
  },
  {
    key: 'posicao_apos_lances' as keyof ProbabilityScores,
    title: 'Posição Após Lances',
    description: 'Nossa posição competitiva após a fase de lances',
    levels: {
      1: 'Posição desfavorável',
      2: 'Posição intermediária',
      3: 'Posição favorável ou vencedora'
    }
  }
];

export const ProbabilityModal: React.FC<ProbabilityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentScores,
  orgaoName
}) => {
  const [scores, setScores] = useState<ProbabilityScores>(
    currentScores || {
      requisitos_habilitacao: 1,
      processo_contratacao: 1,
      plataforma: 1,
      postura_pregoeiro: 1,
      planilha_preco: 1,
      modelo_planilha: 1,
      influencia: 1,
      requisitos_diferenciacao: 1,
      posicao_apos_lances: 1
    }
  );

  React.useEffect(() => {
    if (currentScores) {
      setScores(currentScores);
    }
  }, [currentScores]);

  if (!isOpen) return null;

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  const getProbabilityLevel = (total: number) => {
    if (total < 15) return { level: 'Baixa', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (total <= 21) return { level: 'Média', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'Alta', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const probability = getProbabilityLevel(totalScore);

  const handleScoreChange = (criterion: keyof ProbabilityScores, value: number) => {
    setScores(prev => ({ ...prev, [criterion]: value }));
  };

  const handleSave = () => {
    onSave(scores);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Avaliação de Probabilidade</h2>
            <p className="text-gray-600">{orgaoName}</p>
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
                <p className="text-sm text-gray-600">Pontuação total: {totalScore}/27</p>
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
                <div className="text-red-600">Soma &lt; 15</div>
              </div>
              <div className="text-center p-2 bg-yellow-100 rounded">
                <div className="font-medium text-yellow-800">Média</div>
                <div className="text-yellow-600">Soma 15-21</div>
              </div>
              <div className="text-center p-2 bg-green-100 rounded">
                <div className="font-medium text-green-800">Alta</div>
                <div className="text-green-600">Soma &gt; 21</div>
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
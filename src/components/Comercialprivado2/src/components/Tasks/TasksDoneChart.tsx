import React, { useState, useEffect } from 'react';
import { BarChart3, Info } from 'lucide-react';
import { getDoneSeriesLast30Days } from './tasks.api';

interface TasksDoneChartProps {
  collaborators: any[];
  onDataUpdate?: () => void;
}

export const TasksDoneChart: React.FC<TasksDoneChartProps> = ({ 
  collaborators, 
  onDataUpdate 
}) => {
  const [chartData, setChartData] = useState<{ [assigneeId: string]: Array<{ date: string; count: number }> }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [onDataUpdate]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      const { data, error } = await getDoneSeriesLast30Days();
      if (error) {
        console.warn('Erro ao carregar dados do gráfico:', error);
      } else {
        setChartData(data);
      }
    } catch (err) {
      console.warn('Erro inesperado no gráfico:', err);
    } finally {
      setLoading(false);
    }
  };

  // Colors for different collaborators
  const collaboratorColors = [
    '#3B82F6', // blue-500
    '#10B981', // green-500
    '#8B5CF6', // purple-500
    '#F59E0B', // orange-500
    '#EF4444', // red-500
    '#6366F1', // indigo-500
    '#EC4899', // pink-500
    '#14B8A6'  // teal-500
  ];

  const getCollaboratorColor = (index: number) => {
    return collaboratorColors[index % collaboratorColors.length];
  };

  // Generate last 30 days array
  const generateLast30Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

  const last30Days = generateLast30Days();

  // Calculate max value for chart scaling
  const maxValue = Math.max(
    ...collaborators.flatMap(collab => {
      const series = chartData[collab.id] || [];
      return series.map(point => point.count);
    }),
    1 // minimum scale
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Tarefas Concluídas por Dia</span>
          </h3>
          <p className="text-sm text-gray-600">Últimos 30 dias por colaborador</p>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {collaborators.map((collaborator, index) => (
            <div key={collaborator.id} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getCollaboratorColor(index) }}
              ></div>
              <span className="text-sm text-gray-700">{collaborator.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="flex items-end justify-between space-x-1 h-48 mb-4 ml-8">
          {last30Days.map((date, dayIndex) => (
            <div key={date} className="flex-1 flex flex-col items-center">
              {/* Bars container for all collaborators */}
              <div className="w-full flex justify-center items-end h-40 space-x-1">
                {collaborators.map((collaborator, collabIndex) => {
                  const series = chartData[collaborator.id] || [];
                  const dayData = series.find(point => point.date === date);
                  const count = dayData?.count || 0;
                  
                  const height = maxValue > 0 ? Math.max(2, (count / maxValue) * 100) : 2;
                  const barWidth = Math.max(4, Math.floor(20 / collaborators.length));
                  
                  return (
                    <div 
                      key={collaborator.id}
                      className="group relative flex items-end"
                      style={{
                        height: `${height}%`,
                        width: `${barWidth}px`,
                        backgroundColor: getCollaboratorColor(collabIndex),
                        borderRadius: '2px 2px 0 0',
                        minHeight: count > 0 ? '4px' : '2px'
                      }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        <div className="text-center">
                          <div className="font-medium">{collaborator.name}</div>
                          <div>{count} tarefa{count !== 1 ? 's' : ''} concluída{count !== 1 ? 's' : ''}</div>
                          <div className="text-xs opacity-75">{formatDate(date)}</div>
                        </div>
                      </div>
                      
                      {/* Value on top if > 0 */}
                      {count > 0 && (
                        <div 
                          className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs font-bold"
                          style={{ color: getCollaboratorColor(collabIndex) }}
                        >
                          {count}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Date label (show every 5 days for readability) */}
              {dayIndex % 5 === 0 && (
                <span className="text-xs text-gray-600 mt-1 transform -rotate-45 origin-center">
                  {formatDate(date)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-40 flex flex-col justify-between text-xs text-gray-500 w-6 text-right">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200 text-center">
        <div>
          <div className="text-lg font-bold text-blue-600">
            {collaborators.reduce((total, collab) => {
              const series = chartData[collab.id] || [];
              return total + series.reduce((sum, point) => sum + point.count, 0);
            }, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Concluídas</div>
        </div>
        
        <div>
          <div className="text-lg font-bold text-green-600">
            {Math.round(
              collaborators.reduce((total, collab) => {
                const series = chartData[collab.id] || [];
                return total + series.reduce((sum, point) => sum + point.count, 0);
              }, 0) / 30
            )}
          </div>
          <div className="text-sm text-gray-600">Média/Dia</div>
        </div>
        
        <div>
          <div className="text-lg font-bold text-purple-600">
            {Math.max(...collaborators.map(collab => {
              const series = chartData[collab.id] || [];
              return series.reduce((sum, point) => sum + point.count, 0);
            }))}
          </div>
          <div className="text-sm text-gray-600">Maior Individual</div>
        </div>
        
        <div>
          <div className="text-lg font-bold text-orange-600">
            {collaborators.length}
          </div>
          <div className="text-sm text-gray-600">Colaboradores</div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-600" />
          <p className="text-sm text-blue-800">
            <strong>📊 Gráfico:</strong> Cada linha representa um colaborador • Passe o mouse sobre as barras para detalhes
          </p>
        </div>
      </div>
    </div>
  );
};
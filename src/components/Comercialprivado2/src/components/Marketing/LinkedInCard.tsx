import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LinkedInMetrics, marketingService } from '../../services/marketingService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LinkedInCardProps {
  data: LinkedInMetrics[];
  onDataChange: () => void;
}

const METRICS = [
  { key: 'followers', label: 'Seguidores' },
  { key: 'photo_posts', label: 'Postagens Fotos' },
  { key: 'video_posts', label: 'Postagens Vídeos' },
  { key: 'impressions', label: 'Impressões' },
  { key: 'views', label: 'Visualizações' },
  { key: 'clicks', label: 'Cliques' },
  { key: 'comments', label: 'Comentários' },
  { key: 'shares', label: 'Compartilhamentos' }
];

export const LinkedInCard: React.FC<LinkedInCardProps> = ({ data, onDataChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('followers');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [showAddDate, setShowAddDate] = useState(false);
  const [newDate, setNewDate] = useState('');

  const monthData = useMemo(() => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();

    return data
      .filter(d => {
        const itemDate = new Date(d.date);
        return itemDate.getMonth() === month && itemDate.getFullYear() === year;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, currentMonth]);

  const chartData = useMemo(() => {
    return {
      labels: monthData.map(d => {
        const [year, month, day] = d.date.split('-');
        return `${day}/${month}`;
      }),
      datasets: [
        {
          label: METRICS.find(m => m.key === selectedMetric)?.label || '',
          data: monthData.map(d => d[selectedMetric as keyof LinkedInMetrics] || 0),
          borderColor: '#0A66C2',
          backgroundColor: 'rgba(10, 102, 194, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [monthData, selectedMetric]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y.toLocaleString('pt-BR')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => value.toLocaleString('pt-BR')
        }
      }
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const startEdit = (date: string, dayData: LinkedInMetrics) => {
    setEditingDate(date);
    const values: Record<string, number> = {};
    METRICS.forEach(m => {
      values[m.key] = dayData[m.key as keyof LinkedInMetrics] as number || 0;
    });
    setEditValues(values);
  };

  const cancelEdit = () => {
    setEditingDate(null);
    setEditValues({});
  };

  const saveEdit = async () => {
    if (!editingDate) return;

    try {
      const metrics: LinkedInMetrics = {
        date: editingDate,
        followers: editValues.followers || 0,
        photo_posts: editValues.photo_posts || 0,
        video_posts: editValues.video_posts || 0,
        impressions: editValues.impressions || 0,
        views: editValues.views || 0,
        clicks: editValues.clicks || 0,
        comments: editValues.comments || 0,
        shares: editValues.shares || 0
      };

      await marketingService.upsertLinkedInMetrics(metrics);
      onDataChange();
      setEditingDate(null);
      setEditValues({});
    } catch (error) {
      console.error('Error saving LinkedIn metrics:', error);
      alert('Erro ao salvar métricas do LinkedIn');
    }
  };

  const handleAddDate = async () => {
    if (!newDate) {
      alert('Por favor, selecione uma data');
      return;
    }

    try {
      const metrics: LinkedInMetrics = {
        date: newDate,
        followers: 0,
        photo_posts: 0,
        video_posts: 0,
        impressions: 0,
        views: 0,
        clicks: 0,
        comments: 0,
        shares: 0
      };

      await marketingService.upsertLinkedInMetrics(metrics);
      onDataChange();
      setShowAddDate(false);
      setNewDate('');
    } catch (error) {
      console.error('Error adding LinkedIn date:', error);
      alert('Erro ao adicionar data do LinkedIn');
    }
  };

  const handleDeleteDate = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta data?')) return;

    try {
      await marketingService.deleteLinkedInMetrics(id);
      onDataChange();
    } catch (error) {
      console.error('Error deleting LinkedIn metrics:', error);
      alert('Erro ao excluir métricas do LinkedIn');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div
        className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">in</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">LinkedIn</h3>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </div>

      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {METRICS.map(metric => (
                <option key={metric.key} value={metric.key}>{metric.label}</option>
              ))}
            </select>

            <div className="flex items-center space-x-2">
              <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium">
                {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {monthData.length > 0 ? (
            <div className="h-64 mb-6">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-64 mb-6 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhum dado para exibir neste mês</p>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-semibold text-gray-700">Dados do Mês</h4>
            {!showAddDate ? (
              <button
                onClick={() => setShowAddDate(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Data</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddDate}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowAddDate(false);
                    setNewDate('');
                  }}
                  className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="text-sm table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-white z-10">Métrica</th>
                  {monthData.map((item) => {
                    const [year, month, day] = item.date.split('-');
                    return (
                      <th key={item.date} className="text-center py-2 px-3 font-medium text-gray-700 whitespace-nowrap w-[100px]">
                        {day}/{month}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {METRICS.map(metric => (
                  <tr key={metric.key} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-600 whitespace-nowrap sticky left-0 bg-white z-10">{metric.label}</td>
                    {monthData.map((item) => {
                      const isEditing = editingDate === item.date;
                      const value = item[metric.key as keyof LinkedInMetrics] || 0;

                      return (
                        <td key={item.date} className="text-center py-2 px-3 w-[100px]">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues[metric.key] || 0}
                              onChange={(e) => setEditValues({ ...editValues, [metric.key]: parseInt(e.target.value) || 0 })}
                              className="w-full px-2 py-1 text-center border border-gray-300 rounded"
                            />
                          ) : (
                            <span className="text-gray-900">{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-600 whitespace-nowrap sticky left-0 bg-white z-10">Ações</td>
                  {monthData.map((item) => {
                    const isEditing = editingDate === item.date;

                    return (
                      <td key={item.date} className="text-center py-2 px-3 w-[100px]">
                        {isEditing ? (
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={saveEdit}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() => startEdit(item.date, item)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDate(item.id!)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { InstagramMetrics, LinkedInMetrics } from '../../services/marketingService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ConsolidatedChartProps {
  instagramData: InstagramMetrics[];
  linkedinData: LinkedInMetrics[];
}

type PeriodPreset = '7' | '15' | '30' | '90';

export const ConsolidatedChart: React.FC<ConsolidatedChartProps> = ({
  instagramData,
  linkedinData
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['followers']);
  const [periodDays, setPeriodDays] = useState<number>(7);

  const metrics = [
    { value: 'followers', label: 'Seguidores', color: '#8B5CF6' },
    { value: 'photo_posts', label: 'Posts Foto', color: '#EC4899' },
    { value: 'video_posts', label: 'Posts Vídeo', color: '#F59E0B' },
    { value: 'likes', label: 'Curtidas', color: '#EF4444' },
    { value: 'comments', label: 'Comentários', color: '#10B981' },
    { value: 'shares', label: 'Compartilhamentos', color: '#3B82F6' },
    { value: 'views', label: 'Visualizações', color: '#6366F1' }
  ];

  const periodPresets: { value: PeriodPreset; label: string }[] = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '15', label: 'Últimos 15 dias' },
    { value: '30', label: 'Último mês' },
    { value: '90', label: 'Últimos 3 meses' }
  ];

  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
      }
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const adjustPeriod = (delta: number) => {
    setPeriodDays(Math.max(1, periodDays + delta));
  };

  const getFilteredData = (data: InstagramMetrics[] | LinkedInMetrics[]) => {
    if (data.length === 0) return [];
    const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
    return sortedData.slice(-periodDays);
  };

  const calculateMetricValue = (item: any, metric: string, platform: 'instagram' | 'linkedin') => {
    switch (metric) {
      case 'followers':
        return item.followers || 0;
      case 'photo_posts':
        return item.photo_posts || 0;
      case 'video_posts':
        return item.video_posts || 0;
      case 'likes':
        return platform === 'instagram' ? (item.likes || 0) : 0;
      case 'comments':
        return item.comments || 0;
      case 'shares':
        return item.shares || 0;
      case 'views':
        if (platform === 'instagram') {
          return (item.photo_views || 0) + (item.video_views || 0) + (item.story_views || 0);
        } else {
          return item.views || 0;
        }
      default:
        return 0;
    }
  };

  const chartData = useMemo(() => {
    const filteredInstagram = getFilteredData(instagramData);
    const filteredLinkedin = getFilteredData(linkedinData);

    const instagramLabels = filteredInstagram.map(d => {
      const [year, month, day] = d.date.split('-');
      return `${day}/${month}`;
    });

    const linkedinLabels = filteredLinkedin.map(d => {
      const [year, month, day] = d.date.split('-');
      return `${day}/${month}`;
    });

    const maxLength = Math.max(instagramLabels.length, linkedinLabels.length);

    const spacerCount = 2;
    const spacers = Array(spacerCount).fill('');

    const allLabels = [
      ...instagramLabels,
      ...spacers,
      ...linkedinLabels
    ];

    const datasets = selectedMetrics.map(metric => {
      const metricInfo = metrics.find(m => m.value === metric);
      if (!metricInfo) return null;

      const instagramValues = filteredInstagram.map(item =>
        calculateMetricValue(item, metric, 'instagram')
      );

      const linkedinValues = filteredLinkedin.map(item =>
        calculateMetricValue(item, metric, 'linkedin')
      );

      const combinedData = [
        ...instagramValues,
        ...Array(spacerCount).fill(null),
        ...linkedinValues
      ];

      return {
        label: metricInfo.label,
        data: combinedData,
        backgroundColor: metricInfo.color + 'CC',
        borderColor: metricInfo.color,
        borderWidth: 1,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      };
    }).filter(Boolean);

    return {
      labels: allLabels,
      datasets
    };
  }, [instagramData, linkedinData, selectedMetrics, periodDays]);

  const maxValue = useMemo(() => {
    const allValues = chartData.datasets.flatMap(d =>
      (d?.data || []).filter(v => v !== null) as number[]
    );
    return Math.max(...allValues, 10);
  }, [chartData]);

  const filteredInstagram = getFilteredData(instagramData);
  const filteredLinkedin = getFilteredData(linkedinData);
  const spacerCount = 2;
  const dividerPosition = filteredInstagram.length + Math.floor(spacerCount / 2);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const label = context[0].label;
            const index = context[0].dataIndex;
            const isInstagram = index < filteredInstagram.length;
            if (label === '') return '';
            return `${isInstagram ? 'Instagram' : 'LinkedIn'} - ${label}`;
          },
          label: function(context: any) {
            if (context.parsed.y === null) return '';
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString('pt-BR')}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: true,
          drawOnChartArea: true,
          color: function(context: any) {
            if (context.index === dividerPosition) {
              return 'rgba(0, 0, 0, 0.3)';
            }
            return 'rgba(0, 0, 0, 0.05)';
          },
          lineWidth: function(context: any) {
            if (context.index === dividerPosition) {
              return 3;
            }
            return 1;
          }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10
          },
          callback: function(value: any, index: number) {
            return chartData.labels[index];
          }
        }
      },
      y: {
        beginAtZero: true,
        max: maxValue * 1.1,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString('pt-BR');
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comparativo de Plataformas</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {metrics.map(metric => (
            <button
              key={metric.value}
              onClick={() => toggleMetric(metric.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                selectedMetrics.includes(metric.value)
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustPeriod(-1)}
              className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
              {periodDays} {periodDays === 1 ? 'dia' : 'dias'}
            </span>
            <button
              onClick={() => adjustPeriod(1)}
              className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {periodPresets.map(preset => (
            <button
              key={preset.value}
              onClick={() => setPeriodDays(parseInt(preset.value))}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                periodDays === parseInt(preset.value)
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="grid grid-cols-2 mb-3 gap-4">
          <div className="text-center">
            <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm rounded-lg shadow-sm">
              Instagram
            </div>
          </div>
          <div className="text-center">
            <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-sm rounded-lg shadow-sm">
              LinkedIn
            </div>
          </div>
        </div>
        <div className="h-96 relative">
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

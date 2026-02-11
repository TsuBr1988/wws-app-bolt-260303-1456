import { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KpiHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  okrId: number;
  kpiName: string;
  okrTitle: string;
}

interface KpiDataPoint {
  id: string;
  date: string;
  value: string;
  created_at: string;
}

export function KpiHistoryModal({ isOpen, onClose, okrId, kpiName, okrTitle }: KpiHistoryModalProps) {
  const [data, setData] = useState<KpiDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, okrId, kpiName]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data: historyData, error } = await supabase
        .from('okr_kpi_data')
        .select('*')
        .eq('okr_id', okrId)
        .eq('kpi_name', kpiName)
        .order('date', { ascending: false });

      if (error) throw error;

      setData(historyData || []);
    } catch (error) {
      console.error('Error loading KPI history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Histórico do KPI</h2>
              <p className="text-sm text-gray-600">{kpiName}</p>
              <p className="text-xs text-gray-500 mt-1">{okrTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum dado registrado ainda</p>
              <p className="text-sm text-gray-500 mt-2">
                Use o botão "Inserir Dados" para adicionar valores
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item, index) => {
                const isLatest = index === 0;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      isLatest
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2 ${isLatest ? 'text-blue-700' : 'text-gray-700'}`}>
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {format(new Date(item.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      {isLatest && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                          Mais recente
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isLatest ? 'text-blue-700' : 'text-gray-900'}`}>
                        {item.value}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Registrado em {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

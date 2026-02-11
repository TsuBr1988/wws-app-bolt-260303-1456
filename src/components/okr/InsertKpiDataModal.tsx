import { useState, useEffect } from 'react';
import { X, Calendar, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface KPI {
  name: string;
  okrId: number;
}

interface InsertKpiDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  allKpis: KPI[];
  onDataSaved: () => void;
}

export function InsertKpiDataModal({ isOpen, onClose, allKpis, onDataSaved }: InsertKpiDataModalProps) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadExistingData();
    }
  }, [isOpen, date]);

  const loadExistingData = async () => {
    const { data, error } = await supabase
      .from('okr_kpi_data')
      .select('*')
      .eq('date', date);

    if (!error && data) {
      const existingValues: Record<string, string> = {};
      data.forEach((item: any) => {
        const key = `${item.okr_id}-${item.kpi_name}`;
        existingValues[key] = item.value;
      });
      setValues(existingValues);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const records = Object.entries(values)
        .filter(([_, value]) => value.trim() !== '')
        .map(([key, value]) => {
          const [okrId, ...kpiNameParts] = key.split('-');
          const kpiName = kpiNameParts.join('-');
          return {
            okr_id: parseInt(okrId),
            kpi_name: kpiName,
            date,
            value: value.trim()
          };
        });

      if (records.length === 0) {
        toast({
          title: 'Atenção',
          description: 'Preencha pelo menos um valor',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      for (const record of records) {
        const { error } = await supabase
          .from('okr_kpi_data')
          .upsert(record, {
            onConflict: 'okr_id,kpi_name,date'
          });

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Dados salvos com sucesso',
      });

      onDataSaved();
      onClose();
      setValues({});
    } catch (error) {
      console.error('Error saving KPI data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (okrId: number, kpiName: string, value: string) => {
    const key = `${okrId}-${kpiName}`;
    setValues(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Inserir Dados dos KPIs</h2>
              <p className="text-sm text-gray-600">Preencha os valores para cada indicador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da medição
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {Array.from(new Set(allKpis.map(k => k.okrId))).map(okrId => {
              const okrKpis = allKpis.filter(k => k.okrId === okrId);

              return (
                <div key={okrId} className="border-b border-gray-200 pb-6 last:border-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    OKR {okrId}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {okrKpis.map((kpi) => (
                      <div key={`${kpi.okrId}-${kpi.name}`} className="flex items-center gap-4">
                        <label className="flex-1 text-sm font-medium text-gray-700">
                          {kpi.name}
                        </label>
                        <Input
                          type="text"
                          value={values[`${kpi.okrId}-${kpi.name}`] || ''}
                          onChange={(e) => handleValueChange(kpi.okrId, kpi.name, e.target.value)}
                          placeholder="Digite o valor"
                          className="w-48"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Dados'}
          </Button>
        </div>
      </div>
    </div>
  );
}

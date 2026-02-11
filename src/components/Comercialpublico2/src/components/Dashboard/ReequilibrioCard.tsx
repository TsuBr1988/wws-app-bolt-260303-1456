import React, { useEffect, useState } from 'react';
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';

interface ReequilibrioLembrete {
  id: string;
  client_name: string;
  tipo: 'dissidio' | 'ipca';
  data_lembrete: Date;
  start_date: string;
  ultimo_lembrete?: Date;
}

export const ReequilibrioCard: React.FC = () => {
  const [lembretes, setLembretes] = useState<ReequilibrioLembrete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLembretes();
  }, []);

  const loadLembretes = async () => {
    try {
      setLoading(true);

      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('id, client_name, start_date, reequilibrio_dissidio, reequilibrio_ipca, ultimo_lembrete_dissidio, ultimo_lembrete_ipca')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const lembretesProcessados: ReequilibrioLembrete[] = [];

      contracts?.forEach((contract: any) => {
        // Lembrete de Dissídio - Todo 10 de janeiro
        if (contract.reequilibrio_dissidio) {
          const dataLembrete = new Date(hoje.getFullYear(), 0, 10);

          // Se já passou do dia 10 de janeiro deste ano, considera o próximo ano
          if (hoje > dataLembrete) {
            dataLembrete.setFullYear(dataLembrete.getFullYear() + 1);
          }

          // Verifica se já foi enviado lembrete este ano
          const ultimoLembrete = contract.ultimo_lembrete_dissidio
            ? new Date(contract.ultimo_lembrete_dissidio)
            : null;

          const jaEnviadoEsteAno = ultimoLembrete &&
            ultimoLembrete.getFullYear() === hoje.getFullYear();

          if (!jaEnviadoEsteAno) {
            lembretesProcessados.push({
              id: contract.id,
              client_name: contract.client_name,
              tipo: 'dissidio',
              data_lembrete: dataLembrete,
              start_date: contract.start_date,
              ultimo_lembrete: ultimoLembrete || undefined
            });
          }
        }

        // Lembrete de IPCA - 10 meses após início, depois anualmente
        if (contract.reequilibrio_ipca) {
          const startDate = new Date(contract.start_date);
          const ultimoLembrete = contract.ultimo_lembrete_ipca
            ? new Date(contract.ultimo_lembrete_ipca)
            : null;

          let dataLembrete: Date;

          if (!ultimoLembrete) {
            // Primeiro lembrete: 10 meses após o início
            dataLembrete = new Date(startDate);
            dataLembrete.setMonth(dataLembrete.getMonth() + 10);
          } else {
            // Próximos lembretes: 12 meses após o último
            dataLembrete = new Date(ultimoLembrete);
            dataLembrete.setFullYear(dataLembrete.getFullYear() + 1);
          }

          // Se a data do lembrete já passou e não foi enviado este ano, agenda para o próximo ciclo
          if (hoje > dataLembrete) {
            const jaEnviadoEsteAno = ultimoLembrete &&
              ultimoLembrete.getFullYear() === hoje.getFullYear();

            if (!jaEnviadoEsteAno) {
              lembretesProcessados.push({
                id: contract.id,
                client_name: contract.client_name,
                tipo: 'ipca',
                data_lembrete: dataLembrete,
                start_date: contract.start_date,
                ultimo_lembrete: ultimoLembrete || undefined
              });
            }
          } else {
            lembretesProcessados.push({
              id: contract.id,
              client_name: contract.client_name,
              tipo: 'ipca',
              data_lembrete: dataLembrete,
              start_date: contract.start_date,
              ultimo_lembrete: ultimoLembrete || undefined
            });
          }
        }
      });

      // Ordenar por data
      lembretesProcessados.sort((a, b) =>
        a.data_lembrete.getTime() - b.data_lembrete.getTime()
      );

      setLembretes(lembretesProcessados);
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoEnviado = async (lembrete: ReequilibrioLembrete) => {
    try {
      const campo = lembrete.tipo === 'dissidio'
        ? 'ultimo_lembrete_dissidio'
        : 'ultimo_lembrete_ipca';

      const hoje = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('contracts')
        .update({ [campo]: hoje })
        .eq('id', lembrete.id);

      if (error) throw error;

      alert('✅ Lembrete marcado como enviado!');
      loadLembretes();
    } catch (error) {
      console.error('Erro ao marcar lembrete:', error);
      alert('❌ Erro ao marcar lembrete');
    }
  };

  const getDiasRestantes = (data: Date): number => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diff = data.getTime() - hoje.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusInfo = (diasRestantes: number) => {
    if (diasRestantes < 0) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertCircle,
        label: 'Atrasado'
      };
    } else if (diasRestantes === 0) {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: AlertCircle,
        label: 'Hoje'
      };
    } else if (diasRestantes <= 7) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: Clock,
        label: `${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`
      };
    } else {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: Calendar,
        label: `${diasRestantes} dias`
      };
    }
  };

  const lembretesProximos = lembretes.filter(l => getDiasRestantes(l.data_lembrete) <= 30);
  const lembretesHoje = lembretes.filter(l => getDiasRestantes(l.data_lembrete) === 0);
  const lembretesAtrasados = lembretes.filter(l => getDiasRestantes(l.data_lembrete) < 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Lembretes de Reequilíbrio</h3>
            <p className="text-sm text-gray-500">Dissídio e IPCA</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{lembretesAtrasados.length}</div>
          <div className="text-xs text-red-600 font-medium">Atrasados</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{lembretesHoje.length}</div>
          <div className="text-xs text-orange-600 font-medium">Hoje</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{lembretesProximos.length}</div>
          <div className="text-xs text-blue-600 font-medium">Próximos 30 dias</div>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {lembretesProximos.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum lembrete pendente nos próximos 30 dias</p>
          </div>
        ) : (
          lembretesProximos.map((lembrete) => {
            const diasRestantes = getDiasRestantes(lembrete.data_lembrete);
            const status = getStatusInfo(diasRestantes);
            const StatusIcon = status.icon;

            return (
              <div
                key={`${lembrete.id}-${lembrete.tipo}`}
                className={`${status.bgColor} ${status.borderColor} border rounded-lg p-3`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <StatusIcon className={`w-5 h-5 ${status.color} mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {lembrete.client_name}
                      </h4>
                      <p className={`text-xs ${status.color} font-medium mt-1`}>
                        {lembrete.tipo === 'dissidio' ? 'Dissídio' : 'IPCA 12 meses'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {lembrete.data_lembrete.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <button
                      onClick={() => marcarComoEnviado(lembrete)}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Marcar enviado
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

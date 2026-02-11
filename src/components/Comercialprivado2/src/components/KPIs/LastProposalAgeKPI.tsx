/**
 * Tempo desde a última proposta
 * Cálculo: hoje - data de criação mais recente (created_at) em dias (ceil)
 */
import React, { useMemo, useState } from 'react';
import { Clock, Info, X } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';

interface KPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysSince: number;
  lastDateISO?: string;
  clientName?: string;
}

const LastProposalAgeModal: React.FC<KPIModalProps> = ({ isOpen, onClose, daysSince, lastDateISO, clientName }) => {
  if (!isOpen) return null;

  const fmt = (iso?: string) => iso
    ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
    : '—';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Tempo desde a última proposta
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-1">{daysSince} dias</div>
            <p className="text-sm text-gray-600">desde o último registro de proposta</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Como é calculado?</h3>
            <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
              <li>Busca a proposta com <code>created_at</code> mais recente.</li>
              <li>Diferença em dias entre hoje e essa data.</li>
              <li>Arredondado para cima.</li>
            </ul>
          </div>

          <div className="text-sm text-gray-600">
            Última proposta registrada em: <strong>{fmt(lastDateISO)}</strong>
          </div>

          {clientName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Cliente da última proposta</h4>
              <div className="text-lg font-medium text-blue-800">{clientName}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LastProposalAgeKPI: React.FC = () => {
  const { data: proposals = [], loading } = useSupabaseQuery('proposals');
  const [showModal, setShowModal] = useState(false);

  const { daysSince, lastDateISO, clientName } = useMemo(() => {
    if (!proposals.length) return { daysSince: 0, lastDateISO: undefined as string | undefined, clientName: undefined as string | undefined };
    const latest = proposals.reduce((acc: any, p: any) => {
      if (!acc) return p;
      return new Date(p.created_at).getTime() > new Date(acc.created_at).getTime() ? p : acc;
    }, null);
    const last = latest?.created_at ? new Date(latest.created_at) : null;
    if (!last) return { daysSince: 0, lastDateISO: undefined as string | undefined, clientName: undefined as string | undefined };
    const diffMs = Date.now() - last.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { 
      daysSince: Math.max(0, days), 
      lastDateISO: last.toISOString(),
      clientName: latest?.client
    };
  }, [proposals]);

  return (
    <div className="p-4 border rounded-xl shadow bg-white flex flex-col h-[320px] relative">
      <button
        onClick={() => setShowModal(true)}
        className="absolute top-3 right-3 p-1.5 hover:bg-indigo-100 rounded-full"
        title="Ver detalhes"
      >
        <Info className="w-4 h-4 text-indigo-600" />
      </button>

      <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
        <Clock className="w-4 h-4 text-indigo-600" /> Tempo desde a última proposta
      </h3>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-indigo-600">
          {loading ? '—' : `${daysSince} dias`}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          proposta mais recente: {lastDateISO ? new Date(lastDateISO).toLocaleDateString('pt-BR') : '—'}
        </p>
      </div>

      <div className="mt-auto text-xs text-gray-500">
        • Fonte: campo <code>created_at</code> da tabela <code>proposals</code>
      </div>

      <LastProposalAgeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        daysSince={daysSince}
        lastDateISO={lastDateISO}
        clientName={clientName}
      />
    </div>
  );
};
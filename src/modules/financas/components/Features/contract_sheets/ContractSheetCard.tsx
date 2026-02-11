import React, { useMemo } from 'react';
import { Calendar, TrendingUp, Eye, Trash2 } from 'lucide-react';
import { ContractSheet } from '../../../types';
import { formatCurrency } from '../../../utils';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

interface ContractSheetCardProps {
  sheet: ContractSheet;
  onView: (sheet: ContractSheet) => void;
  onDelete: (id: string) => void;
}

const ContractSheetCardComponent: React.FC<ContractSheetCardProps> = ({ sheet, onView, onDelete }) => {
  // Protege contra data inválida/null/'' e evita crash de format()
  const startDateObj = useMemo(() => {
    try {
      return sheet?.start_date ? new Date(sheet.start_date) : null;
    } catch {
      return null;
    }
  }, [sheet?.start_date]);

  const endDateObj = useMemo(() => {
    try {
      return sheet?.end_date ? new Date(sheet.end_date) : null;
    } catch {
      return null;
    }
  }, [sheet?.end_date]);

  // Evita recomputar soma quando items não mudam
  const totalBudgeted = useMemo(
    () => sheet?.items?.reduce((sum, item) => sum + (Number(item?.budgeted_amount) || 0), 0) ?? 0,
    [sheet?.items]
  );

  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
      role="article"
      aria-label={`Ficha de contrato: ${sheet.client_name}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 mb-1 truncate" title={sheet.client_name}>
            {sheet.client_name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>
              {startDateObj ? format(startDateObj, 'dd/MM/yyyy', { locale: ptBR }) : '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Período de Vigência
          </span>
          <span className="text-sm font-bold text-slate-900">
            {startDateObj && endDateObj ?
              `${format(startDateObj, 'dd/MM/yyyy', { locale: ptBR })} - ${format(endDateObj, 'dd/MM/yyyy', { locale: ptBR })}`
              : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Valor Orçado Total
          </span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            <span className="text-lg font-bold text-emerald-600">
              {formatCurrency(totalBudgeted)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(sheet)}
          className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          aria-label={`Visualizar ficha de ${sheet.client_name}`}
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          Visualizar
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Deseja realmente excluir esta ficha?')) onDelete(sheet.id);
          }}
          className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
          title="Excluir ficha"
          aria-label={`Excluir ficha de ${sheet.client_name}`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

// React.memo para evitar re-renders quando props não mudam
const ContractSheetCard = React.memo(ContractSheetCardComponent);
export default ContractSheetCard;

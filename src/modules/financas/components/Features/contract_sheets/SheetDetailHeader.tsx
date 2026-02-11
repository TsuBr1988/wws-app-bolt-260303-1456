import React from 'react';
import { ArrowLeft, X, Calendar, Plus, History, Ban, Printer } from 'lucide-react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { ContractSheet } from '../../../types';
import { formatCurrency } from '../../../utils';

interface SheetDetailHeaderProps {
  sheet: ContractSheet;
  totalsRange: {
    avgBudgetedTotal: number;
    avgRealizedTotal: number;
    varianceAvg: number;
    varianceAvgPct: number;
  };
  rangeLabel: string;
  onClose: () => void;
  onCreateAddendum: () => void;
  onShowHistory: () => void;
  onTerminate: () => void;
  onPrint: () => void;
}

export const SheetDetailHeader: React.FC<SheetDetailHeaderProps> = ({
  sheet,
  totalsRange,
  rangeLabel,
  onClose,
  onCreateAddendum,
  onShowHistory,
  onTerminate,
  onPrint
}) => {
  return (
    <div className="px-8 py-6 border-b border-slate-100 bg-white rounded-t-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              {sheet.client_name}
            </h3>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(sheet.start_date), 'dd/MM/yyyy', {
                    locale: ptBR
                  })}
                  {' - '}
                  {format(new Date(sheet.end_date), 'dd/MM/yyyy', {
                    locale: ptBR
                  })}
                </span>
              </div>
              {sheet.termination_date && (
                <div className="px-3 py-1 bg-rose-50 rounded-lg">
                  <span className="text-xs font-bold text-rose-700">
                    ENCERRADO em {format(new Date(sheet.termination_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-4 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ficha
          </button>
          {!sheet.termination_date && (
            <button
              onClick={onTerminate}
              className="flex items-center gap-2 px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-semibold transition-colors"
            >
              <Ban className="w-4 h-4" />
              Encerrar
            </button>
          )}
          <button
            onClick={onShowHistory}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl font-semibold transition-colors"
          >
            <History className="w-4 h-4" />
            Histórico
          </button>
          <button
            onClick={onCreateAddendum}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Aditivo
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="text-sm font-medium text-blue-600 mb-1">
            Resultado Operacional (mensal)
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {formatCurrency(totalsRange.avgBudgetedTotal)}
          </div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4">
          <div className="text-sm font-medium text-emerald-600 mb-1">
            Resultado Realizado
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(totalsRange.avgRealizedTotal)}
          </div>
        </div>
        <div
          className={`${
            totalsRange.varianceAvg >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
          } rounded-2xl p-4`}
        >
          <div
            className={`text-sm font-medium mb-1 ${
              totalsRange.varianceAvg >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            Variação (média)
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`text-2xl font-bold ${
                totalsRange.varianceAvg >= 0
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {formatCurrency(Math.abs(totalsRange.varianceAvg))}
            </div>
            <div
              className={`text-sm font-bold ${
                totalsRange.varianceAvg >= 0
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              ({Math.abs(totalsRange.varianceAvgPct).toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { startOfMonth } from '../../../utils';
import { CoaViewMode, CashSubView } from '../../../types';

interface SheetDetailControlsProps {
  localViewMode: CoaViewMode;
  setLocalViewMode: (mode: CoaViewMode) => void;
  localCashSubView: CashSubView;
  setLocalCashSubView: (view: CashSubView) => void;
  startMonthSel: Date;
  setStartMonthSel: (date: Date) => void;
  endMonthSel: Date;
  setEndMonthSel: (date: Date) => void;
  showChart: boolean;
  setShowChart: (show: boolean) => void;
  rangeLabel: string;
  rangeCount: number;
  minStartDate: Date;
}

export const SheetDetailControls: React.FC<SheetDetailControlsProps> = ({
  localViewMode,
  setLocalViewMode,
  localCashSubView,
  setLocalCashSubView,
  startMonthSel,
  setStartMonthSel,
  endMonthSel,
  setEndMonthSel,
  showChart,
  setShowChart,
  rangeLabel,
  rangeCount,
  minStartDate
}) => {
  return (
    <>
      <div className="flex items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setLocalViewMode('cash')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                localViewMode === 'cash'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Caixa
            </button>
            <button
              onClick={() => setLocalViewMode('accrual')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                localViewMode === 'accrual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Competência
            </button>
          </div>

          {localViewMode === 'cash' && (
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setLocalCashSubView('all')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  localCashSubView === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Ambos
              </button>
              <button
                onClick={() => setLocalCashSubView('projected')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  localCashSubView === 'projected'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Previsto
              </button>
              <button
                onClick={() => setLocalCashSubView('realized')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  localCashSubView === 'realized'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Realizado
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-2 py-2">
            <button
              onClick={() => {
                const next = startOfMonth(
                  new Date(
                    startMonthSel.getFullYear(),
                    startMonthSel.getMonth() - 1,
                    1
                  )
                );
                // Não permitir mês anterior ao mês de início da ficha
                if (next >= minStartDate) {
                  setStartMonthSel(next);
                  if (next > endMonthSel) setEndMonthSel(next);
                }
              }}
              className={`p-1 rounded-lg transition-colors ${
                startMonthSel <= minStartDate
                  ? 'cursor-not-allowed opacity-40'
                  : 'hover:bg-white'
              }`}
              disabled={startMonthSel <= minStartDate}
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="px-3 font-bold text-slate-900 text-sm min-w-[120px] text-center">
              Início: {format(startMonthSel, 'MMM/yyyy', { locale: ptBR })}
            </span>
            <button
              onClick={() => {
                const next = startOfMonth(
                  new Date(
                    startMonthSel.getFullYear(),
                    startMonthSel.getMonth() + 1,
                    1
                  )
                );
                setStartMonthSel(next);
                if (next > endMonthSel) setEndMonthSel(next);
              }}
              className="p-1 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-2 py-2">
            <button
              onClick={() => {
                const next = startOfMonth(
                  new Date(
                    endMonthSel.getFullYear(),
                    endMonthSel.getMonth() - 1,
                    1
                  )
                );
                setEndMonthSel(next);
                if (startMonthSel > next) setStartMonthSel(next);
              }}
              className="p-1 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="px-3 font-bold text-slate-900 text-sm min-w-[120px] text-center">
              Final: {format(endMonthSel, 'MMM/yyyy', { locale: ptBR })}
            </span>
            <button
              onClick={() => {
                const next = startOfMonth(
                  new Date(
                    endMonthSel.getFullYear(),
                    endMonthSel.getMonth() + 1,
                    1
                  )
                );
                setEndMonthSel(next);
              }}
              className="p-1 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowChart(!showChart)}
          className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all ${
            showChart
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {showChart ? 'Ver Tabela' : 'Ver Gráfico'}
        </button>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Intervalo:{' '}
        <span className="font-semibold text-slate-700">
          {rangeLabel}
        </span>{' '}
        — {rangeCount} {rangeCount === 1 ? 'mês' : 'meses'}
      </div>
    </>
  );
};

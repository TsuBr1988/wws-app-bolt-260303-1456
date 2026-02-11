import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { Transaction } from '../../../types';
import { formatCurrency } from '../../../utils';

interface TransactionDetailsModalProps {
  onClose: () => void;
  transactions: Transaction[];
  categoryName: string;
  categoryCode: string;
  periodLabel: string;
  value: number;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  onClose,
  transactions,
  categoryName,
  categoryCode,
  periodLabel,
  value
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Detalhamento de Transações
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {categoryCode} - {categoryName}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Período: {periodLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    Total de Transações
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(value)}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {transactions.length} lançamento{transactions.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                        Data
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                        Descrição
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx, idx) => {
                      const displayDate = tx.paymentDate
                        ? new Date(tx.paymentDate)
                        : tx.dueDate
                        ? new Date(tx.dueDate)
                        : tx.competencyDate
                        ? new Date(tx.competencyDate)
                        : null;

                      const statusColor =
                        tx.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : tx.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700';

                      const statusLabel =
                        tx.status === 'completed'
                          ? 'Realizado'
                          : tx.status === 'pending'
                          ? 'Pendente'
                          : 'Outro';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-slate-700">
                            {displayDate
                              ? format(displayDate, 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">
                            {tx.description || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-slate-900">
                            {formatCurrency(
                              typeof tx.amount === 'string'
                                ? parseFloat(
                                    tx.amount.replace(/\./g, '').replace(',', '.')
                                  )
                                : tx.amount
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

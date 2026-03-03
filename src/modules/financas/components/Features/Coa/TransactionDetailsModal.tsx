
import React from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Transaction, CoaNode } from '../../../types';
import { formatCurrency } from '../../../utils';

interface TransactionDetailsModalProps {
  node: CoaNode;
  transactions: Transaction[];
  onClose: () => void;
  month?: Date;
  valueType?: 'projected' | 'realized' | 'accrual' | 'unrealized';
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ node, transactions, onClose, month, valueType }) => {
  const filteredTransactions = transactions.filter(t => {
    if (month) {
      let dateToCompare: Date;

      if (valueType === 'accrual') {
        dateToCompare = t.competencyDate || t.dueDate;
      } else if (valueType === 'realized') {
        dateToCompare = t.paymentDate || t.dueDate;
      } else {
        dateToCompare = t.dueDate;
      }

      const txMonth = format(dateToCompare, 'yyyy-MM');
      const selectedMonth = format(month, 'yyyy-MM');
      if (txMonth !== selectedMonth) return false;
    }

    if (valueType) {
      if (valueType === 'unrealized' && t.status !== 'pending') return false;
      if (valueType === 'realized' && t.status !== 'completed') return false;
    }

    return true;
  });

  const total = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                    {node.code}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  {month
                    ? `${valueType === 'projected' ? 'Previsto' : valueType === 'realized' ? 'Realizado' : valueType === 'unrealized' ? 'Não Realizado' : 'Competência'} - ${format(month, 'MMMM yyyy', { locale: ptBR })}`
                    : 'Detalhes da Categoria'
                  }
                </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{node.name}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-5 bg-white border-b border-slate-50 flex items-center gap-8 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.02)] z-10">
             <div>
                 <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Transações</p>
                 <p className="text-2xl font-bold text-slate-800">{filteredTransactions.length}</p>
             </div>
             <div className="w-px h-10 bg-slate-100"></div>
             <div>
                 <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Volume Financeiro</p>
                 <p className={`text-2xl font-bold ${total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {formatCurrency(total)}
                 </p>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-8 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Data</th>
                        <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Descrição</th>
                        <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Fornecedor</th>
                        <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Centro de Custo</th>
                        <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Empresa</th>
                        <th className="px-8 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-right">Valor</th>
                        <th className="px-8 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredTransactions.map(t => {
                        let displayDate: Date;
                        if (valueType === 'accrual') {
                            displayDate = t.competencyDate || t.dueDate;
                        } else if (valueType === 'realized') {
                            displayDate = t.paymentDate || t.dueDate;
                        } else if (valueType === 'unrealized' || valueType === 'projected') {
                            displayDate = t.dueDate;
                        } else {
                            displayDate = t.dueDate;
                        }

                        return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-8 py-4 text-slate-500 font-medium text-xs whitespace-nowrap">
                                {format(displayDate, 'dd/MM/yyyy')}
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-slate-800 font-semibold truncate max-w-[240px]" title={t.description}>
                                    {t.description}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-slate-600 text-xs truncate max-w-[200px]" title={t.nome || '-'}>
                                    {t.nome || '-'}
                                </div>
                            </td>
                             <td className="px-6 py-4">
                                <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                                    {t.costCenter}
                                </span>
                            </td>
                             <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                                {t.company === 'Worldwide Segurança' ?
                                    <span className="text-blue-600">Worldwide</span> :
                                    <span className="text-emerald-600">WWS</span>
                                }
                            </td>
                            <td className={`px-8 py-4 text-right font-bold whitespace-nowrap ${t.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatCurrency(t.amount)}
                            </td>
                            <td className="px-8 py-4 text-right whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                    t.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {t.status === 'completed' ? 'Realizado' : 'Previsto'}
                                </span>
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/30 flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
                Fechar Detalhes
            </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;

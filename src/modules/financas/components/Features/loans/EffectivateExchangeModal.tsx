import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle } from 'lucide-react';
import { format, addMonths, parseISO } from 'date-fns';

interface Installment {
    installment_number: number;
    due_date: string;
    principal_amount: string;
    interest_amount: string;
}

interface EffectivateExchangeModalProps {
    operationNumber: string;
    totalNetAmount: number;
    interestRate: number;
    startDate: string;
    onClose: () => void;
    onConfirm: (installments: Installment[]) => void;
}

const EffectivateExchangeModal: React.FC<EffectivateExchangeModalProps> = ({
    operationNumber,
    totalNetAmount,
    interestRate,
    startDate,
    onClose,
    onConfirm
}) => {
    const [installmentsCount, setInstallmentsCount] = useState<number>(12);
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [showInstallments, setShowInstallments] = useState(false);

    const generateInstallments = () => {
        const monthlyInterestRate = interestRate / 100 / 12;
        let installmentAmount: number;

        if (interestRate > 0) {
            installmentAmount = totalNetAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, installmentsCount)) /
                              (Math.pow(1 + monthlyInterestRate, installmentsCount) - 1);
        } else {
            installmentAmount = totalNetAmount / installmentsCount;
        }

        const newInstallments: Installment[] = [];
        let remainingPrincipal = totalNetAmount;

        for (let i = 0; i < installmentsCount; i++) {
            const dueDate = addMonths(parseISO(startDate), i);
            const interestAmount = remainingPrincipal * monthlyInterestRate;
            const principalAmount = installmentAmount - interestAmount;

            if (i === installmentsCount - 1) {
                newInstallments.push({
                    installment_number: i + 1,
                    due_date: format(dueDate, 'yyyy-MM-dd'),
                    principal_amount: remainingPrincipal.toFixed(2),
                    interest_amount: interestAmount.toFixed(2)
                });
            } else {
                newInstallments.push({
                    installment_number: i + 1,
                    due_date: format(dueDate, 'yyyy-MM-dd'),
                    principal_amount: principalAmount.toFixed(2),
                    interest_amount: interestAmount.toFixed(2)
                });
                remainingPrincipal -= principalAmount;
            }
        }

        setInstallments(newInstallments);
        setShowInstallments(true);
    };

    const updateInstallment = (index: number, field: keyof Installment, value: string) => {
        const updated = [...installments];
        updated[index] = { ...updated[index], [field]: value };
        setInstallments(updated);
    };

    const addInstallment = () => {
        const lastInstallment = installments[installments.length - 1];
        const nextDueDate = lastInstallment
            ? addMonths(parseISO(lastInstallment.due_date), 1)
            : parseISO(startDate);

        setInstallments([
            ...installments,
            {
                installment_number: installments.length + 1,
                due_date: format(nextDueDate, 'yyyy-MM-dd'),
                principal_amount: '',
                interest_amount: '0.00'
            }
        ]);
    };

    const removeInstallment = (index: number) => {
        const updated = installments.filter((_, i) => i !== index);
        const renumbered = updated.map((inst, i) => ({
            ...inst,
            installment_number: i + 1
        }));
        setInstallments(renumbered);
    };

    const handleConfirm = () => {
        if (installments.length === 0) {
            alert('Gere as parcelas primeiro');
            return;
        }

        const hasEmptyValues = installments.some(
            i => !i.due_date || !i.principal_amount || i.principal_amount === '0'
        );

        if (hasEmptyValues) {
            alert('Preencha todos os valores das parcelas');
            return;
        }

        onConfirm(installments);
    };

    const totalPrincipal = installments.reduce((sum, i) => sum + parseFloat(i.principal_amount || '0'), 0);
    const totalInterest = installments.reduce((sum, i) => sum + parseFloat(i.interest_amount || '0'), 0);
    const grandTotal = totalPrincipal + totalInterest;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-br from-emerald-50 to-green-50 border-b border-emerald-100 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-emerald-900">Efetivar Operação</h2>
                            <p className="text-sm text-emerald-700">Operação {operationNumber}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white hover:bg-emerald-50 flex items-center justify-center border border-emerald-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-emerald-600" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">Total Líquido</p>
                            <p className="text-xl font-bold text-emerald-900">{formatCurrency(totalNetAmount)}</p>
                            <p className="text-xs text-emerald-700 mt-1">Valor a ser emprestado</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Taxa de Juros</p>
                            <p className="text-xl font-bold text-blue-900">{interestRate}% a.a.</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Data Início</p>
                            <p className="text-xl font-bold text-amber-900">{format(parseISO(startDate), 'dd/MM/yyyy')}</p>
                        </div>
                    </div>

                    {!showInstallments ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm font-bold text-blue-900 mb-2">Importante</p>
                                <p className="text-sm text-blue-700 mb-2">
                                    O empréstimo será calculado sobre o <strong>valor líquido</strong> de {formatCurrency(totalNetAmount)}.
                                    Configure abaixo o número de parcelas para efetuar a operação.
                                </p>
                                <p className="text-sm text-blue-700">
                                    Após efetivar, esta operação será convertida em um empréstimo e aparecerá na lista de empréstimos.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Número de Parcelas</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={installmentsCount}
                                    onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 1)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>
                            <button
                                onClick={generateInstallments}
                                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                            >
                                Gerar Parcelas
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">Parcelas do Empréstimo</h3>
                                <button
                                    onClick={addInstallment}
                                    className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-sm hover:bg-emerald-200 transition-colors flex items-center gap-2 border border-emerald-200"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar
                                </button>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">#</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Vencimento</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Principal</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Juros</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Total</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wide">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {installments.map((installment, index) => {
                                                const principal = parseFloat(installment.principal_amount || '0');
                                                const interest = parseFloat(installment.interest_amount || '0');
                                                const total = principal + interest;

                                                return (
                                                    <tr key={index} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200">
                                                                {installment.installment_number}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="date"
                                                                value={installment.due_date}
                                                                onChange={(e) => updateInstallment(index, 'due_date', e.target.value)}
                                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={installment.principal_amount}
                                                                onChange={(e) => updateInstallment(index, 'principal_amount', e.target.value)}
                                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                                                placeholder="0.00"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={installment.interest_amount}
                                                                onChange={(e) => updateInstallment(index, 'interest_amount', e.target.value)}
                                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                                                placeholder="0.00"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-sm font-bold text-slate-900">
                                                                {formatCurrency(total)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => removeInstallment(index)}
                                                                className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-rose-600" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                                            <tr>
                                                <td colSpan={2} className="px-4 py-3 text-right font-bold text-slate-700">TOTAL:</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-bold text-slate-900">{formatCurrency(totalPrincipal)}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-bold text-slate-900">{formatCurrency(totalInterest)}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-bold text-emerald-700">{formatCurrency(grandTotal)}</span>
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {Math.abs(totalPrincipal - totalNetAmount) > 0.01 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <p className="text-sm font-bold text-amber-900">
                                        Atenção: O total do principal ({formatCurrency(totalPrincipal)}) difere do valor líquido ({formatCurrency(totalNetAmount)})
                                    </p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        Diferença: {formatCurrency(Math.abs(totalPrincipal - totalNetAmount))}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100 p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    {showInstallments && (
                        <button
                            onClick={() => {
                                setShowInstallments(false);
                                setInstallments([]);
                            }}
                            className="flex-1 px-6 py-3 bg-amber-100 text-amber-700 rounded-xl font-bold hover:bg-amber-200 transition-colors"
                        >
                            Recalcular
                        </button>
                    )}
                    {showInstallments && (
                        <button
                            onClick={handleConfirm}
                            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                        >
                            Efetivar Operação
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EffectivateExchangeModal;

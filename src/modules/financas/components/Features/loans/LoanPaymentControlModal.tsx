import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SupabaseClient } from '@supabase/supabase-js';

interface LoanInstallment {
    id: string;
    loan_id: string;
    installment_number: number;
    due_date: string;
    amount: number;
    paid: boolean;
    payment_date: string | null;
}

interface PaymentNote {
    id: string;
    note_number: string;
    reference: string;
    client_name: string;
    total_amount: number;
    remaining_amount: number;
}

interface InstallmentPayment {
    id: string;
    installment_id: string;
    payment_note_id: string;
    amount_paid: number;
    payment_date: string;
    payment_note?: PaymentNote;
}

interface LoanPaymentControlModalProps {
    loanId: string;
    loanName: string;
    supabaseClient: SupabaseClient | null;
    onClose: () => void;
}

const LoanPaymentControlModal: React.FC<LoanPaymentControlModalProps> = ({
    loanId,
    loanName,
    supabaseClient,
    onClose
}) => {
    const [installments, setInstallments] = useState<LoanInstallment[]>([]);
    const [paymentNotes, setPaymentNotes] = useState<PaymentNote[]>([]);
    const [installmentPayments, setInstallmentPayments] = useState<InstallmentPayment[]>([]);
    const [selectedInstallment, setSelectedInstallment] = useState<LoanInstallment | null>(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [loading, setLoading] = useState(false);

    const [paymentData, setPaymentData] = useState({
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        amount_paid: '',
        payment_note_id: ''
    });

    useEffect(() => {
        if (supabaseClient) {
            fetchData();
        }
    }, [supabaseClient, loanId]);

    const fetchData = async () => {
        if (!supabaseClient) return;

        setLoading(true);
        try {
            const { data: installmentsData, error: installmentsError } = await supabaseClient
                .from('loan_installments')
                .select('*')
                .eq('loan_id', loanId)
                .order('installment_number', { ascending: true });

            if (installmentsError) throw installmentsError;

            const { data: notesData, error: notesError } = await supabaseClient
                .from('payment_notes')
                .select('*')
                .gt('remaining_amount', 0)
                .order('created_at', { ascending: false });

            if (notesError) throw notesError;

            const { data: paymentsData, error: paymentsError } = await supabaseClient
                .from('installment_payments')
                .select(`
                    *,
                    payment_note:payment_notes(*)
                `)
                .in('installment_id', (installmentsData || []).map(i => i.id));

            if (paymentsError) throw paymentsError;

            setInstallments(installmentsData || []);
            setPaymentNotes(notesData || []);
            setInstallmentPayments(paymentsData || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayInstallment = async () => {
        if (!supabaseClient || !selectedInstallment) return;

        if (!paymentData.payment_note_id || !paymentData.amount_paid) {
            alert('Selecione uma nota e informe o valor pago');
            return;
        }

        const amountPaid = parseFloat(paymentData.amount_paid);
        const selectedNote = paymentNotes.find(n => n.id === paymentData.payment_note_id);

        if (!selectedNote) {
            alert('Nota de pagamento não encontrada');
            return;
        }

        if (amountPaid > selectedNote.remaining_amount) {
            alert(`O valor informado (${formatCurrency(amountPaid)}) é maior que o saldo disponível da nota (${formatCurrency(selectedNote.remaining_amount)})`);
            return;
        }

        const existingPayments = installmentPayments.filter(p => p.installment_id === selectedInstallment.id);
        const totalPaid = existingPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
        const remainingInstallment = Number(selectedInstallment.amount) - totalPaid;

        if (amountPaid > remainingInstallment) {
            alert(`O valor informado (${formatCurrency(amountPaid)}) é maior que o saldo da parcela (${formatCurrency(remainingInstallment)})`);
            return;
        }

        try {
            const { error: paymentError } = await supabaseClient
                .from('installment_payments')
                .insert({
                    installment_id: selectedInstallment.id,
                    payment_note_id: paymentData.payment_note_id,
                    amount_paid: amountPaid,
                    payment_date: paymentData.payment_date
                });

            if (paymentError) throw paymentError;

            const newRemainingNote = selectedNote.remaining_amount - amountPaid;
            const { error: updateNoteError } = await supabaseClient
                .from('payment_notes')
                .update({ remaining_amount: newRemainingNote })
                .eq('id', paymentData.payment_note_id);

            if (updateNoteError) throw updateNoteError;

            const newRemainingInstallment = remainingInstallment - amountPaid;
            if (newRemainingInstallment <= 0.01) {
                const { error: updateInstallmentError } = await supabaseClient
                    .from('loan_installments')
                    .update({
                        paid: true,
                        payment_date: paymentData.payment_date
                    })
                    .eq('id', selectedInstallment.id);

                if (updateInstallmentError) throw updateInstallmentError;
            }

            await fetchData();
            setShowPaymentForm(false);
            setSelectedInstallment(null);
            setPaymentData({
                payment_date: format(new Date(), 'yyyy-MM-dd'),
                amount_paid: '',
                payment_note_id: ''
            });

            if (newRemainingInstallment > 0.01) {
                alert(`Pagamento registrado! Residual da parcela: ${formatCurrency(newRemainingInstallment)}`);
            } else {
                alert('Pagamento registrado! Parcela quitada.');
            }
        } catch (error: any) {
            console.error('Erro ao registrar pagamento:', error);
            alert('Erro ao registrar pagamento: ' + error.message);
        }
    };

    const handleDeletePayment = async (paymentId: string, amountPaid: number, noteId: string) => {
        if (!supabaseClient) return;

        if (!confirm('Tem certeza que deseja excluir este pagamento?')) return;

        try {
            const { error: deleteError } = await supabaseClient
                .from('installment_payments')
                .delete()
                .eq('id', paymentId);

            if (deleteError) throw deleteError;

            const note = paymentNotes.find(n => n.id === noteId);
            if (note) {
                const { error: updateNoteError } = await supabaseClient
                    .from('payment_notes')
                    .update({
                        remaining_amount: note.remaining_amount + amountPaid
                    })
                    .eq('id', noteId);

                if (updateNoteError) throw updateNoteError;
            }

            await fetchData();
            alert('Pagamento excluído com sucesso!');
        } catch (error: any) {
            console.error('Erro ao excluir pagamento:', error);
            alert('Erro ao excluir pagamento: ' + error.message);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getInstallmentPayments = (installmentId: string) => {
        return installmentPayments.filter(p => p.installment_id === installmentId);
    };

    const getInstallmentTotalPaid = (installmentId: string) => {
        const payments = getInstallmentPayments(installmentId);
        return payments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
    };

    const getInstallmentRemaining = (installment: LoanInstallment) => {
        const totalPaid = getInstallmentTotalPaid(installment.id);
        return Number(installment.amount) - totalPaid;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-br from-blue-50 to-cyan-50 border-b border-blue-100 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-blue-900">Controle de Pagamentos</h2>
                            <p className="text-sm text-blue-700">{loanName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white hover:bg-blue-50 flex items-center justify-center border border-blue-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-blue-600" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Tabela de Parcelas */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Parcelas do Empréstimo</h3>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Vencimento</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Valor</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Pago</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Saldo</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wide">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wide">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {installments.map(installment => {
                                        const payments = getInstallmentPayments(installment.id);
                                        const totalPaid = getInstallmentTotalPaid(installment.id);
                                        const remaining = getInstallmentRemaining(installment);
                                        const isPaid = remaining <= 0.01;

                                        return (
                                            <React.Fragment key={installment.id}>
                                                <tr className="hover:bg-slate-50">
                                                    <td className="px-4 py-4">
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200">
                                                            {installment.installment_number}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-slate-700">
                                                        {format(parseISO(installment.due_date), 'dd/MM/yyyy')}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-bold text-slate-900">
                                                        {formatCurrency(Number(installment.amount))}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-bold text-emerald-700">
                                                        {formatCurrency(totalPaid)}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-bold text-rose-700">
                                                        {formatCurrency(remaining)}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {isPaid ? (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                                                                <CheckCircle className="w-3 h-3" />
                                                                QUITADO
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold">
                                                                <XCircle className="w-3 h-3" />
                                                                EM ABERTO
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        {!isPaid && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedInstallment(installment);
                                                                    setPaymentData({
                                                                        ...paymentData,
                                                                        amount_paid: remaining.toFixed(2)
                                                                    });
                                                                    setShowPaymentForm(true);
                                                                }}
                                                                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
                                                            >
                                                                Pagar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                                {payments.length > 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-3 bg-slate-50">
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Pagamentos Realizados:</p>
                                                                {payments.map(payment => (
                                                                    <div key={payment.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200">
                                                                        <div className="flex items-center gap-4">
                                                                            <div>
                                                                                <p className="text-sm font-bold text-slate-900">
                                                                                    Nota: {payment.payment_note?.note_number}
                                                                                </p>
                                                                                <p className="text-xs text-slate-600">
                                                                                    Cliente: {payment.payment_note?.client_name} • Ref: {payment.payment_note?.reference}
                                                                                </p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-sm font-bold text-emerald-700">
                                                                                    {formatCurrency(Number(payment.amount_paid))}
                                                                                </p>
                                                                                <p className="text-xs text-slate-600">
                                                                                    {format(parseISO(payment.payment_date), 'dd/MM/yyyy')}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleDeletePayment(payment.id, Number(payment.amount_paid), payment.payment_note_id)}
                                                                            className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                                                                        >
                                                                            <Trash2 className="w-4 h-4 text-rose-600" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Form Modal */}
            {showPaymentForm && selectedInstallment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-br from-emerald-50 to-green-50 border-b border-emerald-100 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-emerald-900">Registrar Pagamento</h2>
                                <p className="text-sm text-emerald-700">Parcela {selectedInstallment.installment_number}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPaymentForm(false);
                                    setSelectedInstallment(null);
                                }}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-emerald-50 flex items-center justify-center border border-emerald-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-emerald-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Valor da Parcela</p>
                                    <p className="text-xl font-bold text-slate-900">{formatCurrency(Number(selectedInstallment.amount))}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Já Pago</p>
                                    <p className="text-xl font-bold text-emerald-700">{formatCurrency(getInstallmentTotalPaid(selectedInstallment.id))}</p>
                                </div>
                                <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-1">Saldo</p>
                                    <p className="text-xl font-bold text-rose-700">{formatCurrency(getInstallmentRemaining(selectedInstallment))}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nota de Pagamento *</label>
                                {paymentNotes.length === 0 ? (
                                    <div className="w-full px-4 py-3 border border-amber-200 bg-amber-50 rounded-xl text-amber-800 text-sm">
                                        Nenhuma nota disponível. Efetive trocas de notas primeiro na aba "Empréstimos / Trocas de Notas".
                                    </div>
                                ) : (
                                    <select
                                        value={paymentData.payment_note_id}
                                        onChange={(e) => setPaymentData({ ...paymentData, payment_note_id: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    >
                                        <option value="">Selecione uma nota</option>
                                        {paymentNotes.map(note => (
                                            <option key={note.id} value={note.id}>
                                                {note.note_number} - {note.client_name} - Disponível: {formatCurrency(note.remaining_amount)}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {paymentData.payment_note_id && (
                                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Saldo Disponível na Nota</p>
                                                <p className="text-2xl font-bold text-blue-900 mt-1">
                                                    {formatCurrency(paymentNotes.find(n => n.id === paymentData.payment_note_id)?.remaining_amount || 0)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-blue-700 font-bold">
                                                    {paymentNotes.find(n => n.id === paymentData.payment_note_id)?.note_number}
                                                </p>
                                                <p className="text-xs text-blue-600">
                                                    {paymentNotes.find(n => n.id === paymentData.payment_note_id)?.client_name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Valor a Pagar *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={paymentData.amount_paid}
                                            onChange={(e) => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
                                            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                            placeholder="0.00"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const remaining = getInstallmentRemaining(selectedInstallment);
                                                setPaymentData({ ...paymentData, amount_paid: remaining.toFixed(2) });
                                            }}
                                            className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-200 transition-colors whitespace-nowrap"
                                        >
                                            Pagar Restante
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Data do Pagamento *</label>
                                    <input
                                        type="date"
                                        value={paymentData.payment_date}
                                        onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 p-6 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowPaymentForm(false);
                                    setSelectedInstallment(null);
                                }}
                                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handlePayInstallment}
                                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                            >
                                Confirmar Pagamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoanPaymentControlModal;

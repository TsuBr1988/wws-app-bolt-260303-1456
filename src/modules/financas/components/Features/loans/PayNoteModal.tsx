import React, { useState, useEffect } from 'react';
import { X, DollarSign, Plus, Search, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { SupabaseClient } from '@supabase/supabase-js';
import ClientSelector from '../../ClientSelector';

interface NoteExchangeItem {
    id: string;
    exchange_id: string;
    company: string;
    client: string;
    contract: string;
    gross_amount: number;
    net_amount: number;
    reference: string;
    original_due_date: string;
    note_number: string;
}

interface PaymentNote {
    id: string;
    note_number: string;
    reference: string;
    client_name: string;
    total_amount: number;
    remaining_amount: number;
    note_exchange_item_id: string | null;
}

interface PayNoteModalProps {
    item: NoteExchangeItem;
    supabaseClient: SupabaseClient | null;
    onClose: () => void;
    onSuccess: () => void;
}

const PayNoteModal: React.FC<PayNoteModalProps> = ({
    item,
    supabaseClient,
    onClose,
    onSuccess
}) => {
    const [paymentNotes, setPaymentNotes] = useState<PaymentNote[]>([]);
    const [showCreateNote, setShowCreateNote] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [totalPaid, setTotalPaid] = useState(0);
    const [remainingAmount, setRemainingAmount] = useState(item.net_amount);

    const [paymentData, setPaymentData] = useState({
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        amount_paid: '',
        payment_note_id: ''
    });

    const [newNoteData, setNewNoteData] = useState({
        note_number: '',
        reference: '',
        client_name: '',
        total_amount: ''
    });

    useEffect(() => {
        fetchPaymentNotes();
        fetchExistingPayments();
    }, []);

    const fetchPaymentNotes = async () => {
        if (!supabaseClient) return;

        try {
            const { data, error } = await supabaseClient
                .from('payment_notes')
                .select('*')
                .gt('remaining_amount', 0)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setPaymentNotes(data || []);
        } catch (error) {
            console.error('Erro ao carregar notas de pagamento:', error);
        }
    };

    const fetchExistingPayments = async () => {
        if (!supabaseClient) return;

        try {
            const { data, error } = await supabaseClient
                .from('note_payments')
                .select('amount_paid')
                .eq('note_exchange_item_id', item.id);

            if (error) throw error;

            const total = data?.reduce((sum, payment) => sum + Number(payment.amount_paid), 0) || 0;
            setTotalPaid(total);
            setRemainingAmount(Number(item.net_amount) - total);
        } catch (error) {
            console.error('Erro ao carregar pagamentos existentes:', error);
        }
    };

    const handleCreatePaymentNote = async () => {
        if (!supabaseClient) return;

        if (!newNoteData.note_number || !newNoteData.client_name || !newNoteData.total_amount) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const totalAmount = parseFloat(newNoteData.total_amount);

            const { data, error } = await supabaseClient
                .from('payment_notes')
                .insert({
                    note_number: newNoteData.note_number,
                    reference: newNoteData.reference,
                    client_name: newNoteData.client_name,
                    total_amount: totalAmount,
                    remaining_amount: totalAmount
                })
                .select()
                .single();

            if (error) throw error;

            await fetchPaymentNotes();
            setPaymentData({ ...paymentData, payment_note_id: data.id });
            setShowCreateNote(false);
            setNewNoteData({
                note_number: '',
                reference: '',
                client_name: '',
                total_amount: ''
            });
        } catch (error: any) {
            console.error('Erro ao criar nota de pagamento:', error);
            alert('Erro ao criar nota de pagamento: ' + error.message);
        }
    };

    const handlePayment = async () => {
        if (!supabaseClient) return;

        if (!paymentData.payment_date || !paymentData.amount_paid || !paymentData.payment_note_id) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        const amountPaid = parseFloat(paymentData.amount_paid);
        if (amountPaid <= 0) {
            alert('O valor pago deve ser maior que zero');
            return;
        }

        if (amountPaid > remainingAmount) {
            alert(`O valor pago não pode ser maior que o saldo restante (${formatCurrency(remainingAmount)})`);
            return;
        }

        const selectedNote = paymentNotes.find(n => n.id === paymentData.payment_note_id);
        if (!selectedNote) {
            alert('Selecione uma nota de pagamento válida');
            return;
        }

        if (amountPaid > selectedNote.remaining_amount) {
            alert(`O valor pago não pode ser maior que o resquício disponível da nota de pagamento (${formatCurrency(selectedNote.remaining_amount)})`);
            return;
        }

        setLoading(true);
        try {
            const { error: paymentError } = await supabaseClient
                .from('note_payments')
                .insert({
                    note_exchange_item_id: item.id,
                    payment_date: paymentData.payment_date,
                    amount_paid: amountPaid,
                    payment_note_id: paymentData.payment_note_id
                });

            if (paymentError) throw paymentError;

            const newRemaining = selectedNote.remaining_amount - amountPaid;
            const { error: updateError } = await supabaseClient
                .from('payment_notes')
                .update({
                    remaining_amount: newRemaining,
                    updated_at: new Date().toISOString()
                })
                .eq('id', paymentData.payment_note_id);

            if (updateError) throw updateError;

            const newItemRemaining = remainingAmount - amountPaid;
            if (newItemRemaining <= 0.01) {
                alert(`✅ Nota ${item.note_number} foi PAGA COMPLETAMENTE!`);
            }

            onSuccess();
        } catch (error: any) {
            console.error('Erro ao registrar pagamento:', error);
            alert('Erro ao registrar pagamento: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const filteredNotes = paymentNotes.filter(note => {
        if (!search.trim()) return true;
        const query = search.toLowerCase();
        return note.note_number.toLowerCase().includes(query) ||
               note.client_name.toLowerCase().includes(query) ||
               note.reference.toLowerCase().includes(query);
    });

    const selectedNote = paymentNotes.find(n => n.id === paymentData.payment_note_id);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-br from-emerald-50 to-green-50 border-b border-emerald-100 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-emerald-900">Registrar Pagamento</h2>
                            <p className="text-sm text-emerald-700">Nota {item.note_number} - {item.client}</p>
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
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Valor Líquido</p>
                                <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(item.net_amount))}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">Total Pago</p>
                                <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Saldo</p>
                                <p className="text-2xl font-bold text-red-700">{formatCurrency(remainingAmount)}</p>
                            </div>
                        </div>
                        {totalPaid > 0 && (
                            <div className="pt-3 border-t border-slate-300">
                                <p className="text-xs text-slate-600">
                                    Este é o valor que ainda falta pagar desta nota
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Data do Pagamento *</label>
                            <input
                                type="date"
                                value={paymentData.payment_date}
                                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-slate-700">Valor Pago *</label>
                                <button
                                    type="button"
                                    onClick={() => setPaymentData({ ...paymentData, amount_paid: remainingAmount.toFixed(2) })}
                                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors border border-emerald-200 flex items-center gap-1"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Quitar Saldo Restante
                                </button>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                value={paymentData.amount_paid}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    // Permite pequenas diferenças de arredondamento (0.01)
                                    if (value <= remainingAmount + 0.01) {
                                        setPaymentData({ ...paymentData, amount_paid: e.target.value });
                                    } else {
                                        alert(`O valor não pode ser maior que o saldo restante (${formatCurrency(remainingAmount)})`);
                                    }
                                }}
                                placeholder="0.00"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                            <p className="text-xs text-slate-500 mt-1">Máximo: {formatCurrency(remainingAmount)}</p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700">Nota Utilizada para Pagamento *</label>
                                    <p className="text-xs text-slate-500 mt-0.5">Todas as notas criadas em operações estão disponíveis aqui</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateNote(!showCreateNote)}
                                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Nova Nota
                                </button>
                            </div>

                            {showCreateNote && (
                                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                                    <h4 className="text-sm font-bold text-blue-900">Criar Nova Nota Manual</h4>
                                    <p className="text-xs text-blue-700">Use para notas que não vieram de operações de troca</p>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={newNoteData.note_number}
                                                onChange={(e) => setNewNoteData({ ...newNoteData, note_number: e.target.value })}
                                                placeholder="Número da Nota *"
                                                className="px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            />
                                            <input
                                                type="text"
                                                value={newNoteData.reference}
                                                onChange={(e) => setNewNoteData({ ...newNoteData, reference: e.target.value })}
                                                placeholder="Competência"
                                                className="px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-blue-800 mb-1.5">
                                                Cliente (Centro de Custo) *
                                            </label>
                                            <ClientSelector
                                                value={newNoteData.client_name}
                                                onChange={(clientName) => setNewNoteData({ ...newNoteData, client_name: clientName })}
                                                supabaseClient={supabaseClient}
                                                placeholder="Selecione ou digite o nome do cliente"
                                                className="w-full"
                                            />
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newNoteData.total_amount}
                                            onChange={(e) => setNewNoteData({ ...newNoteData, total_amount: e.target.value })}
                                            placeholder="Valor Total *"
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreatePaymentNote}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                                    >
                                        Criar Nota
                                    </button>
                                </div>
                            )}

                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar notas..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                                {filteredNotes.map(note => (
                                    <div
                                        key={note.id}
                                        onClick={() => setPaymentData({ ...paymentData, payment_note_id: note.id })}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                            paymentData.payment_note_id === note.id
                                                ? 'bg-emerald-100 border-emerald-300'
                                                : 'bg-white border-slate-200 hover:border-emerald-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                                        {note.note_number}
                                                    </span>
                                                    {note.note_exchange_item_id && (
                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                                                            Operação
                                                        </span>
                                                    )}
                                                    {note.reference && (
                                                        <span className="text-xs text-slate-600">Ref: {note.reference}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-slate-900">{note.client_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-600">Disponível</p>
                                                <p className="text-sm font-bold text-emerald-700">
                                                    {formatCurrency(Number(note.remaining_amount))}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Total: {formatCurrency(Number(note.total_amount))}
                                        </p>
                                    </div>
                                ))}

                                {filteredNotes.length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        <p className="text-sm">Nenhuma nota disponível</p>
                                        <p className="text-xs mt-1">Crie novas operações de troca ou adicione notas manualmente</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedNote && (
                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Nota Selecionada</p>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-slate-600 mb-0.5">Número</p>
                                        <p className="font-bold text-slate-900">{selectedNote.note_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-600 mb-0.5">Cliente</p>
                                        <p className="font-bold text-slate-900">{selectedNote.client_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-600 mb-0.5">Valor Total</p>
                                        <p className="font-bold text-slate-900">{formatCurrency(Number(selectedNote.total_amount))}</p>
                                    </div>
                                    <div>
                                        <p className="text-emerald-700 mb-0.5">Resquício</p>
                                        <p className="font-bold text-emerald-700">{formatCurrency(Number(selectedNote.remaining_amount))}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-slate-100 p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processando...
                            </>
                        ) : (
                            'Confirmar Pagamento'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayNoteModal;

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CheckCircle, Plus, Trash2, AlertCircle, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SupabaseClient } from '@supabase/supabase-js';
import PayNoteModal from './PayNoteModal';
import ClientSelector from '../../ClientSelector';
import { Company } from '../../../types';
import { getCompanyShortName } from '../../../utils';

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
    created_at: string;
    updated_at: string;
}

interface NotePayment {
    id: string;
    note_exchange_item_id: string;
    payment_date: string;
    amount_paid: number;
    payment_note_id: string;
    payment_note?: {
        note_number: string;
        reference: string;
        client_name: string;
        total_amount: number;
    };
}

interface NoteExchangeDetailModalProps {
    exchangeId: string;
    operationNumber: string;
    supabaseClient: SupabaseClient | null;
    onClose: () => void;
}

const NoteExchangeDetailModal: React.FC<NoteExchangeDetailModalProps> = ({
    exchangeId,
    operationNumber,
    supabaseClient,
    onClose
}) => {
    const [items, setItems] = useState<NoteExchangeItem[]>([]);
    const [payments, setPayments] = useState<NotePayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<NoteExchangeItem | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<NoteExchangeItem | null>(null);
    const [editFormData, setEditFormData] = useState({
        note_number: '',
        client: '',
        gross_amount: '',
        net_amount: '',
        reference: '',
        original_due_date: ''
    });

    useEffect(() => {
        fetchData();
    }, [exchangeId]);

    const fetchData = async () => {
        if (!supabaseClient) return;

        setLoading(true);
        try {
            const { data: itemsData, error: itemsError } = await supabaseClient
                .from('note_exchange_items')
                .select('*')
                .eq('exchange_id', exchangeId)
                .order('created_at', { ascending: false });

            if (itemsError) throw itemsError;

            const { data: paymentsData, error: paymentsError } = await supabaseClient
                .from('note_payments')
                .select(`
                    *,
                    payment_note:payment_notes(
                        note_number,
                        reference,
                        client_name,
                        total_amount
                    )
                `)
                .in('note_exchange_item_id', (itemsData || []).map(i => i.id));

            if (paymentsError) throw paymentsError;

            setItems(itemsData || []);
            setPayments(paymentsData || []);

            if (itemsData && itemsData.length > 0) {
                const allPaid = itemsData.every(item => {
                    const paid = paymentsData?.filter(p => p.note_exchange_item_id === item.id)
                        .reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
                    return Number(item.net_amount) - paid <= 0.01;
                });

                if (allPaid && itemsData.length > 0) {
                    const hasAlert = sessionStorage.getItem(`exchange-paid-${exchangeId}`);
                    if (!hasAlert) {
                        sessionStorage.setItem(`exchange-paid-${exchangeId}`, 'true');
                        setTimeout(() => {
                            alert(`🎉 OPERAÇÃO ${operationNumber} FOI PAGA COMPLETAMENTE!`);
                        }, 100);
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
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

    const getItemPayments = (itemId: string) => {
        return payments.filter(p => p.note_exchange_item_id === itemId);
    };

    const getTotalPaid = (itemId: string) => {
        return getItemPayments(itemId).reduce((acc, p) => acc + Number(p.amount_paid), 0);
    };

    const getRemainingAmount = (item: NoteExchangeItem) => {
        return Number(item.net_amount) - getTotalPaid(item.id);
    };

    const handlePayNote = (item: NoteExchangeItem) => {
        setSelectedItem(item);
        setShowPayModal(true);
    };

    const handleEditNote = (item: NoteExchangeItem) => {
        setEditingItem(item);
        setEditFormData({
            note_number: item.note_number,
            client: item.client,
            gross_amount: item.gross_amount.toString(),
            net_amount: item.net_amount.toString(),
            reference: item.reference,
            original_due_date: item.original_due_date
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!supabaseClient || !editingItem) return;

        if (!editFormData.note_number || !editFormData.client) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('note_exchange_items')
                .update({
                    note_number: editFormData.note_number,
                    client: editFormData.client,
                    gross_amount: parseFloat(editFormData.gross_amount),
                    net_amount: parseFloat(editFormData.net_amount),
                    reference: editFormData.reference,
                    original_due_date: editFormData.original_due_date,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingItem.id);

            if (error) throw error;

            const grossTotal = items.reduce((sum, item) => {
                if (item.id === editingItem.id) {
                    return sum + parseFloat(editFormData.gross_amount);
                }
                return sum + Number(item.gross_amount);
            }, 0);

            const netTotal = items.reduce((sum, item) => {
                if (item.id === editingItem.id) {
                    return sum + parseFloat(editFormData.net_amount);
                }
                return sum + Number(item.net_amount);
            }, 0);

            const { error: updateExchangeError } = await supabaseClient
                .from('note_exchanges')
                .update({
                    total_gross_amount: grossTotal,
                    total_net_amount: netTotal,
                    updated_at: new Date().toISOString()
                })
                .eq('id', exchangeId);

            if (updateExchangeError) throw updateExchangeError;

            const { data: paymentNoteData, error: fetchPaymentNoteError } = await supabaseClient
                .from('payment_notes')
                .select('*')
                .eq('note_exchange_item_id', editingItem.id)
                .maybeSingle();

            if (fetchPaymentNoteError) throw fetchPaymentNoteError;

            if (paymentNoteData) {
                const amountUsed = Number(paymentNoteData.total_amount) - Number(paymentNoteData.remaining_amount);
                const newNetAmount = parseFloat(editFormData.net_amount);
                const newRemainingAmount = Math.max(0, newNetAmount - amountUsed);

                const { error: updatePaymentNoteError } = await supabaseClient
                    .from('payment_notes')
                    .update({
                        note_number: editFormData.note_number,
                        reference: editFormData.reference,
                        client_name: editFormData.client,
                        total_amount: newNetAmount,
                        remaining_amount: newRemainingAmount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('note_exchange_item_id', editingItem.id);

                if (updatePaymentNoteError) throw updatePaymentNoteError;
            }

            await fetchData();
            setShowEditModal(false);
            setEditingItem(null);
            alert('Nota atualizada com sucesso!');
        } catch (error: any) {
            console.error('Erro ao atualizar nota:', error);
            alert('Erro ao atualizar nota: ' + error.message);
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!supabaseClient) return;

        if (!confirm('Tem certeza que deseja excluir este pagamento?')) return;

        try {
            const payment = payments.find(p => p.id === paymentId);
            if (!payment) return;

            const { error: deleteError } = await supabaseClient
                .from('note_payments')
                .delete()
                .eq('id', paymentId);

            if (deleteError) throw deleteError;

            const { data: noteData, error: noteError } = await supabaseClient
                .from('payment_notes')
                .select('remaining_amount')
                .eq('id', payment.payment_note_id)
                .single();

            if (noteError) throw noteError;

            const newRemaining = Number(noteData.remaining_amount) + Number(payment.amount_paid);
            const { error: updateError } = await supabaseClient
                .from('payment_notes')
                .update({
                    remaining_amount: newRemaining,
                    updated_at: new Date().toISOString()
                })
                .eq('id', payment.payment_note_id);

            if (updateError) throw updateError;

            await fetchData();
            alert('Pagamento excluído com sucesso!');
        } catch (error: any) {
            console.error('Erro ao excluir pagamento:', error);
            alert('Erro ao excluir pagamento: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-12 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-600">Carregando detalhes...</p>
                </div>
            </div>
        );
    }

    const allItemsPaid = items.length > 0 && items.every(item => getRemainingAmount(item) <= 0.01);

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-gradient-to-br from-amber-50 to-yellow-50 border-b border-amber-100 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200">
                                <DollarSign className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-amber-900">Operação {operationNumber}</h2>
                                <p className="text-sm text-amber-700">Notas trocadas e pagamentos</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-white hover:bg-amber-50 flex items-center justify-center border border-amber-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-amber-600" />
                        </button>
                    </div>

                    {allItemsPaid && (
                        <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-4 flex items-center gap-3 border-b-2 border-emerald-600">
                            <CheckCircle className="w-6 h-6" />
                            <div className="flex-1">
                                <p className="font-bold text-lg">Operação Completamente Paga!</p>
                                <p className="text-sm text-emerald-50">Todas as notas desta operação foram quitadas</p>
                            </div>
                        </div>
                    )}

                    <div className="p-6 space-y-4">
                        {items.map(item => {
                            const itemPayments = getItemPayments(item.id);
                            const totalPaid = getTotalPaid(item.id);
                            const remaining = getRemainingAmount(item);
                            const isPaid = remaining <= 0.01;

                            return (
                                <div key={item.id} className={`rounded-xl border p-5 ${
                                    isPaid
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : 'bg-white border-slate-200'
                                }`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
                                                    {item.note_number}
                                                </span>
                                                <span className="text-xs font-bold text-slate-600">
                                                    {getCompanyShortName(item.company as Company)}
                                                </span>
                                                {isPaid && (
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        PAGO
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-base font-bold text-slate-900 mb-1">{item.client}</p>
                                            <p className="text-sm text-slate-600">{item.contract}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Referência: {item.reference} | Venc. Original: {format(parseISO(item.original_due_date), 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditNote(item)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Editar
                                            </button>
                                            {!isPaid && (
                                                <button
                                                    onClick={() => handlePayNote(item)}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Pagar Nota
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Valor Líquido</p>
                                            <p className="text-base font-bold text-slate-900">{formatCurrency(Number(item.net_amount))}</p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Total Pago</p>
                                            <p className="text-base font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
                                        </div>
                                        <div className={`rounded-lg p-3 border ${
                                            remaining > 0.01
                                                ? 'bg-rose-50 border-rose-200'
                                                : 'bg-slate-50 border-slate-200'
                                        }`}>
                                            <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${
                                                remaining > 0.01 ? 'text-rose-700' : 'text-slate-600'
                                            }`}>Saldo</p>
                                            <p className={`text-base font-bold ${
                                                remaining > 0.01 ? 'text-rose-700' : 'text-slate-900'
                                            }`}>{formatCurrency(remaining)}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Pagamentos</p>
                                            <p className="text-base font-bold text-slate-900">{itemPayments.length}</p>
                                        </div>
                                    </div>

                                    {itemPayments.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Histórico de Pagamentos</h4>
                                            {itemPayments.map(payment => (
                                                <div key={payment.id} className="bg-white rounded-lg p-3 border border-slate-200 flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="text-sm font-bold text-slate-900">
                                                                {format(parseISO(payment.payment_date), 'dd/MM/yyyy')}
                                                            </span>
                                                            <span className="text-xs text-slate-500">•</span>
                                                            <span className="text-sm font-bold text-emerald-700">
                                                                {formatCurrency(Number(payment.amount_paid))}
                                                            </span>
                                                        </div>
                                                        {payment.payment_note && (
                                                            <div className="text-xs text-slate-600">
                                                                Nota: <span className="font-bold">{payment.payment_note.note_number}</span> |
                                                                Ref: {payment.payment_note.reference} |
                                                                Cliente: {payment.payment_note.client_name} |
                                                                Valor Total: {formatCurrency(Number(payment.payment_note.total_amount))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeletePayment(payment.id)}
                                                        className="p-2 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                                                        title="Excluir pagamento"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-rose-600" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {items.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <p className="font-medium">Nenhuma nota encontrada</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showPayModal && selectedItem && (
                <PayNoteModal
                    item={selectedItem}
                    supabaseClient={supabaseClient}
                    onClose={() => {
                        setShowPayModal(false);
                        setSelectedItem(null);
                    }}
                    onSuccess={() => {
                        fetchData();
                        setShowPayModal(false);
                        setSelectedItem(null);
                    }}
                />
            )}

            {showEditModal && editingItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                                    <Edit2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-blue-900">Editar Nota</h2>
                                    <p className="text-sm text-blue-700">Atualize as informações da nota</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingItem(null);
                                }}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-blue-50 flex items-center justify-center border border-blue-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-blue-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Número da Nota *</label>
                                    <input
                                        type="text"
                                        value={editFormData.note_number}
                                        onChange={(e) => setEditFormData({ ...editFormData, note_number: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="Ex: 3090"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Empresa</label>
                                    <input
                                        type="text"
                                        value={editingItem.company}
                                        disabled
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cliente (Centro de Custo) *</label>
                                <ClientSelector
                                    value={editFormData.client}
                                    onChange={(clientName) => setEditFormData({ ...editFormData, client: clientName })}
                                    supabaseClient={supabaseClient}
                                    placeholder="Selecione ou digite o nome do cliente"
                                    className="w-full"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Valor Bruto *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editFormData.gross_amount}
                                        onChange={(e) => setEditFormData({ ...editFormData, gross_amount: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Valor Líquido *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editFormData.net_amount}
                                        onChange={(e) => setEditFormData({ ...editFormData, net_amount: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Observações</label>
                                    <input
                                        type="text"
                                        value={editFormData.reference}
                                        onChange={(e) => setEditFormData({ ...editFormData, reference: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="Adicione observações sobre esta nota (opcional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Venc. Original</label>
                                    <input
                                        type="date"
                                        value={editFormData.original_due_date}
                                        onChange={(e) => setEditFormData({ ...editFormData, original_due_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingItem(null);
                                    }}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NoteExchangeDetailModal;

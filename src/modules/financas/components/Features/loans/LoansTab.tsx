import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, X, DollarSign, Calendar, TrendingUp, CheckCircle, XCircle, Edit2, Trash2, Eye, BarChart3, FileText, Receipt, ChevronDown, ChevronRight } from 'lucide-react';
import { format, addMonths, parseISO, differenceInMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { SupabaseClient } from '@supabase/supabase-js';
import { Company } from '../../../types';
import { COMPANIES, getCompanyShortName } from '../../../utils';
import NoteExchangeDetailModal from './NoteExchangeDetailModal';
import EffectivateExchangeModal from './EffectivateExchangeModal';
import LoanPaymentControlModal from './LoanPaymentControlModal';
import ClientSelector from '../../ClientSelector';

interface Loan {
    id: string;
    company: string;
    lender: string;
    description: string;
    total_amount: number;
    interest_rate: number;
    start_date: string;
    end_date: string | null;
    installments_count: number;
    status: 'active' | 'paid';
    created_at: string;
    updated_at: string;
}

interface LoanInstallment {
    id: string;
    loan_id: string;
    installment_number: number;
    due_date: string;
    amount: number;
    paid: boolean;
    payment_date: string | null;
    created_at: string;
    updated_at: string;
}

interface NoteExchange {
    id: string;
    operation_number: string;
    interest_rate: number;
    due_date: string;
    total_gross_amount: number;
    total_net_amount: number;
    created_at: string;
    updated_at: string;
}

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
    paid?: boolean;
    payment_date?: string | null;
    created_at: string;
    updated_at: string;
}

interface LoansTabProps {
    selectedCompany: Company | 'all';
    supabaseClient: SupabaseClient | null;
}

const LoansTab: React.FC<LoansTabProps> = ({ selectedCompany, supabaseClient }) => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [installments, setInstallments] = useState<LoanInstallment[]>([]);
    const [noteExchanges, setNoteExchanges] = useState<NoteExchange[]>([]);
    const [noteExchangeItems, setNoteExchangeItems] = useState<NoteExchangeItem[]>([]);
    const [notePayments, setNotePayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCashFlowModal, setShowCashFlowModal] = useState(false);
    const [showNoteExchangeModal, setShowNoteExchangeModal] = useState(false);
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [currentExchangeId, setCurrentExchangeId] = useState<string | null>(null);
    const [showNoteDetailModal, setShowNoteDetailModal] = useState(false);
    const [selectedExchange, setSelectedExchange] = useState<NoteExchange | null>(null);
    const [showEffectivateModal, setShowEffectivateModal] = useState(false);
    const [showPaymentControlModal, setShowPaymentControlModal] = useState(false);
    const [activeView, setActiveView] = useState<'operations' | 'control'>('operations');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const [formData, setFormData] = useState({
        company: 'WWS Services',
        lender: '',
        description: '',
        total_amount: '',
        interest_rate: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        installments_count: '12'
    });

    const [noteExchangeData, setNoteExchangeData] = useState({
        operation_number: '',
        interest_rate: '',
        due_date: format(new Date(), 'yyyy-MM-dd')
    });

    const [noteItemData, setNoteItemData] = useState({
        company: 'WWS Services',
        client: '',
        gross_amount: '',
        net_amount: '',
        reference: '',
        original_due_date: format(new Date(), 'yyyy-MM-dd'),
        note_number: ''
    });

    useEffect(() => {
        if (supabaseClient) {
            fetchData();
        }
    }, [supabaseClient]);

    const fetchData = async () => {
        if (!supabaseClient) return;

        setLoading(true);
        try {
            const { data: loansData, error: loansError } = await supabaseClient
                .from('loans')
                .select('*')
                .order('created_at', { ascending: false });

            if (loansError) throw loansError;

            const { data: installmentsData, error: installmentsError } = await supabaseClient
                .from('loan_installments')
                .select('*')
                .order('due_date', { ascending: true });

            if (installmentsError) throw installmentsError;

            const { data: exchangesData, error: exchangesError } = await supabaseClient
                .from('note_exchanges')
                .select('*')
                .order('created_at', { ascending: false });

            if (exchangesError) throw exchangesError;

            const { data: itemsData, error: itemsError } = await supabaseClient
                .from('note_exchange_items')
                .select('*');

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
                `);

            if (paymentsError) throw paymentsError;

            setLoans(loansData || []);
            setInstallments(installmentsData || []);
            setNoteExchanges(exchangesData || []);
            setNoteExchangeItems(itemsData || []);
            setNotePayments(paymentsData || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLoan = async () => {
        if (!supabaseClient) return;

        if (!formData.lender || !formData.description || !formData.total_amount) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const totalAmount = parseFloat(formData.total_amount);
            const interestRate = parseFloat(formData.interest_rate) || 0;
            const installmentsCount = parseInt(formData.installments_count);

            const monthlyInterestRate = interestRate / 100 / 12;
            let installmentAmount: number;

            if (interestRate > 0) {
                installmentAmount = totalAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, installmentsCount)) /
                                  (Math.pow(1 + monthlyInterestRate, installmentsCount) - 1);
            } else {
                installmentAmount = totalAmount / installmentsCount;
            }

            const endDate = addMonths(parseISO(formData.start_date), installmentsCount - 1);

            const { data: loanData, error: loanError } = await supabaseClient
                .from('loans')
                .insert({
                    company: formData.company,
                    lender: formData.lender,
                    description: formData.description,
                    total_amount: totalAmount,
                    interest_rate: interestRate,
                    start_date: formData.start_date,
                    end_date: format(endDate, 'yyyy-MM-dd'),
                    installments_count: installmentsCount,
                    status: 'active'
                })
                .select()
                .single();

            if (loanError) throw loanError;

            const installmentsToCreate = [];
            for (let i = 0; i < installmentsCount; i++) {
                const dueDate = addMonths(parseISO(formData.start_date), i);
                installmentsToCreate.push({
                    loan_id: loanData.id,
                    installment_number: i + 1,
                    due_date: format(dueDate, 'yyyy-MM-dd'),
                    amount: installmentAmount,
                    paid: false
                });
            }

            const { error: installmentsError } = await supabaseClient
                .from('loan_installments')
                .insert(installmentsToCreate);

            if (installmentsError) throw installmentsError;

            await fetchData();
            setShowAddModal(false);
            setFormData({
                company: 'WWS Services',
                lender: '',
                description: '',
                total_amount: '',
                interest_rate: '',
                start_date: format(new Date(), 'yyyy-MM-dd'),
                installments_count: '12'
            });
        } catch (error: any) {
            console.error('Erro ao criar empréstimo:', error);
            alert('Erro ao criar empréstimo: ' + error.message);
        }
    };

    const handleCreateNoteExchange = async () => {
        if (!supabaseClient) return;

        if (!noteExchangeData.operation_number || !noteExchangeData.due_date) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const { data: exchangeData, error: exchangeError } = await supabaseClient
                .from('note_exchanges')
                .insert({
                    operation_number: noteExchangeData.operation_number,
                    interest_rate: parseFloat(noteExchangeData.interest_rate) || 0,
                    due_date: noteExchangeData.due_date,
                    total_gross_amount: 0,
                    total_net_amount: 0,
                    status: 'pending'
                })
                .select()
                .single();

            if (exchangeError) throw exchangeError;

            setCurrentExchangeId(exchangeData.id);
            await fetchData();
        } catch (error: any) {
            console.error('Erro ao criar troca de notas:', error);
            alert('Erro ao criar troca de notas: ' + error.message);
        }
    };

    const handleAddNoteItem = async () => {
        if (!supabaseClient || !currentExchangeId) return;

        if (!noteItemData.client || !noteItemData.gross_amount ||
            !noteItemData.net_amount || !noteItemData.note_number) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const { data: itemData, error: itemError } = await supabaseClient
                .from('note_exchange_items')
                .insert({
                    exchange_id: currentExchangeId,
                    company: noteItemData.company,
                    client: noteItemData.client,
                    gross_amount: parseFloat(noteItemData.gross_amount),
                    net_amount: parseFloat(noteItemData.net_amount),
                    reference: noteItemData.reference,
                    original_due_date: noteItemData.original_due_date,
                    note_number: noteItemData.note_number
                })
                .select()
                .single();

            if (itemError) throw itemError;

            const { error: paymentNoteError } = await supabaseClient
                .from('payment_notes')
                .insert({
                    note_number: noteItemData.note_number,
                    reference: noteItemData.reference,
                    client_name: noteItemData.client,
                    total_amount: parseFloat(noteItemData.net_amount),
                    remaining_amount: parseFloat(noteItemData.net_amount),
                    note_exchange_item_id: itemData.id
                });

            if (paymentNoteError) throw paymentNoteError;

            const items = noteExchangeItems.filter(i => i.exchange_id === currentExchangeId);
            const totalGross = items.reduce((acc, i) => acc + Number(i.gross_amount), 0) + parseFloat(noteItemData.gross_amount);
            const totalNet = items.reduce((acc, i) => acc + Number(i.net_amount), 0) + parseFloat(noteItemData.net_amount);

            const { error: updateError } = await supabaseClient
                .from('note_exchanges')
                .update({
                    total_gross_amount: totalGross,
                    total_net_amount: totalNet
                })
                .eq('id', currentExchangeId);

            if (updateError) throw updateError;

            await fetchData();
            setShowAddNoteModal(false);
            setNoteItemData({
                company: 'WWS Services',
                client: '',
                gross_amount: '',
                net_amount: '',
                reference: '',
                original_due_date: format(new Date(), 'yyyy-MM-dd'),
                note_number: ''
            });
        } catch (error: any) {
            console.error('Erro ao adicionar nota:', error);
            alert('Erro ao adicionar nota: ' + error.message);
        }
    };

    const handleDeleteNoteExchange = async (exchangeId: string) => {
        if (!supabaseClient) return;

        if (!confirm('Tem certeza que deseja excluir esta operação de troca de notas?')) return;

        try {
            const { error } = await supabaseClient
                .from('note_exchanges')
                .delete()
                .eq('id', exchangeId);

            if (error) throw error;

            await fetchData();
            if (currentExchangeId === exchangeId) {
                setShowNoteExchangeModal(false);
                setCurrentExchangeId(null);
            }
        } catch (error: any) {
            console.error('Erro ao excluir troca de notas:', error);
            alert('Erro ao excluir troca de notas: ' + error.message);
        }
    };

    const handleEffectivateExchange = async (installments: any[]) => {
        if (!supabaseClient || !currentExchangeId) return;

        try {
            const exchange = noteExchanges.find(e => e.id === currentExchangeId);
            if (!exchange) return;

            const totalNetAmount = Number(exchange.total_net_amount);
            const installmentsCount = installments.length;
            const lastInstallment = installments[installmentsCount - 1];
            const endDate = lastInstallment.due_date;

            const { data: loanData, error: loanError } = await supabaseClient
                .from('loans')
                .insert({
                    company: 'Troca de Notas',
                    lender: `Operação ${exchange.operation_number}`,
                    description: `Troca de notas - Operação ${exchange.operation_number}`,
                    total_amount: totalNetAmount,
                    interest_rate: exchange.interest_rate,
                    start_date: exchange.due_date,
                    end_date: endDate,
                    installments_count: installmentsCount,
                    status: 'active'
                })
                .select()
                .single();

            if (loanError) throw loanError;

            const installmentsToInsert = installments.map(inst => ({
                loan_id: loanData.id,
                installment_number: inst.installment_number,
                due_date: inst.due_date,
                amount: parseFloat(inst.principal_amount) + parseFloat(inst.interest_amount),
                paid: false
            }));

            const { error: installmentsError } = await supabaseClient
                .from('loan_installments')
                .insert(installmentsToInsert);

            if (installmentsError) throw installmentsError;

            const { error: updateError } = await supabaseClient
                .from('note_exchanges')
                .update({
                    status: 'effectivated',
                    loan_id: loanData.id
                })
                .eq('id', currentExchangeId);

            if (updateError) throw updateError;

            await fetchData();
            setShowEffectivateModal(false);
            setShowNoteExchangeModal(false);
            setCurrentExchangeId(null);
            setSelectedExchange(null);

            alert('Operação efetivada com sucesso! Um empréstimo foi criado.');
        } catch (error: any) {
            console.error('Erro ao efetivar operação:', error);
            alert('Erro ao efetivar operação: ' + error.message);
        }
    };

    const handleDeleteNoteItem = async (itemId: string) => {
        if (!supabaseClient || !currentExchangeId) return;

        try {
            const item = noteExchangeItems.find(i => i.id === itemId);
            if (!item) return;

            const { error: deleteError } = await supabaseClient
                .from('note_exchange_items')
                .delete()
                .eq('id', itemId);

            if (deleteError) throw deleteError;

            const items = noteExchangeItems.filter(i => i.exchange_id === currentExchangeId && i.id !== itemId);
            const totalGross = items.reduce((acc, i) => acc + Number(i.gross_amount), 0);
            const totalNet = items.reduce((acc, i) => acc + Number(i.net_amount), 0);

            const { error: updateError } = await supabaseClient
                .from('note_exchanges')
                .update({
                    total_gross_amount: totalGross,
                    total_net_amount: totalNet
                })
                .eq('id', currentExchangeId);

            if (updateError) throw updateError;

            await fetchData();
        } catch (error: any) {
            console.error('Erro ao excluir nota:', error);
            alert('Erro ao excluir nota: ' + error.message);
        }
    };

    const handleToggleInstallmentPaid = async (installmentId: string, currentPaid: boolean) => {
        if (!supabaseClient) return;

        try {
            const { error } = await supabaseClient
                .from('loan_installments')
                .update({
                    paid: !currentPaid,
                    payment_date: !currentPaid ? format(new Date(), 'yyyy-MM-dd') : null
                })
                .eq('id', installmentId);

            if (error) throw error;

            await fetchData();

            const loanInstallments = installments.filter(i => i.loan_id === installments.find(i => i.id === installmentId)?.loan_id);
            const allPaid = loanInstallments.every(i => i.id === installmentId ? !currentPaid : i.paid);

            if (allPaid) {
                const loanId = installments.find(i => i.id === installmentId)?.loan_id;
                if (loanId) {
                    await supabaseClient
                        .from('loans')
                        .update({ status: 'paid' })
                        .eq('id', loanId);
                    await fetchData();
                }
            }
        } catch (error: any) {
            console.error('Erro ao atualizar parcela:', error);
            alert('Erro ao atualizar parcela: ' + error.message);
        }
    };

    const handleToggleNotePaid = async (noteId: string, currentPaid: boolean) => {
        if (!supabaseClient) return;

        try {
            const { error } = await supabaseClient
                .from('note_exchange_items')
                .update({
                    paid: !currentPaid,
                    payment_date: !currentPaid ? format(new Date(), 'yyyy-MM-dd') : null
                })
                .eq('id', noteId);

            if (error) throw error;

            await fetchData();
        } catch (error: any) {
            console.error('Erro ao atualizar nota:', error);
            alert('Erro ao atualizar nota: ' + error.message);
        }
    };

    const handleDeleteLoan = async (loanId: string) => {
        if (!supabaseClient) return;

        if (!confirm('Tem certeza que deseja excluir este empréstimo?')) return;

        try {
            const { error } = await supabaseClient
                .from('loans')
                .delete()
                .eq('id', loanId);

            if (error) throw error;

            await fetchData();
            if (selectedLoan?.id === loanId) {
                setShowDetailModal(false);
                setSelectedLoan(null);
            }
        } catch (error: any) {
            console.error('Erro ao excluir empréstimo:', error);
            alert('Erro ao excluir empréstimo: ' + error.message);
        }
    };

    const filteredLoans = useMemo(() => {
        return loans.filter(loan => {
            const companyMatch = selectedCompany === 'all' || loan.company === selectedCompany;
            if (!companyMatch) return false;

            if (search.trim() !== '') {
                const query = search.toLowerCase();
                return loan.lender.toLowerCase().includes(query) ||
                       loan.description.toLowerCase().includes(query);
            }

            return true;
        });
    }, [loans, selectedCompany, search]);

    const currentExchangeItems = useMemo(() => {
        if (!currentExchangeId) return [];
        return noteExchangeItems.filter(i => i.exchange_id === currentExchangeId);
    }, [currentExchangeId, noteExchangeItems]);

    const currentExchange = useMemo(() => {
        if (!currentExchangeId) return null;
        return noteExchanges.find(e => e.id === currentExchangeId) || null;
    }, [currentExchangeId, noteExchanges]);

    const stats = useMemo(() => {
        const totalPaid = notePayments.reduce((acc, p) => acc + Number(p.amount_paid), 0);

        const operationsWithUnpaidNotes = noteExchanges.filter(exchange => {
            const items = noteExchangeItems.filter(i => i.exchange_id === exchange.id);
            if (items.length === 0) return false;

            const exchangePayments = notePayments.filter(p =>
                items.some(i => i.id === p.note_exchange_item_id)
            );
            const totalPaidForExchange = exchangePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
            const totalNoteValue = items.reduce((sum, i) => sum + Number(i.gross_amount), 0);

            return totalNoteValue - totalPaidForExchange > 0.01;
        });

        const totalGrossAmount = noteExchanges.reduce((acc, e) => acc + Number(e.total_gross_amount), 0);
        const totalNetAmount = noteExchanges.reduce((acc, e) => acc + Number(e.total_net_amount), 0);
        const totalInterest = totalGrossAmount - totalNetAmount;

        const totalPending = totalGrossAmount - totalPaid;

        const overdueExchanges = noteExchanges.filter(exchange => {
            const items = noteExchangeItems.filter(i => i.exchange_id === exchange.id);
            if (items.length === 0) return false;

            const exchangePayments = notePayments.filter(p =>
                items.some(i => i.id === p.note_exchange_item_id)
            );
            const totalPaidForExchange = exchangePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
            const totalNoteValue = items.reduce((sum, i) => sum + Number(i.gross_amount), 0);
            const hasUnpaidNotes = totalNoteValue - totalPaidForExchange > 0.01;

            return hasUnpaidNotes && new Date(exchange.due_date) < new Date();
        }).length;

        return {
            activeLoansCount: operationsWithUnpaidNotes.length,
            totalBorrowed: totalGrossAmount,
            totalInterest,
            totalPaid,
            totalPending,
            overdueInstallments: overdueExchanges
        };
    }, [noteExchanges, noteExchangeItems, notePayments]);

    const cashFlowData = useMemo(() => {
        const today = new Date();
        const startDate = startOfMonth(today);
        const endDate = endOfMonth(addMonths(today, 11));

        const months = eachMonthOfInterval({ start: startDate, end: endDate });

        return months.map(month => {
            const monthKey = format(month, 'yyyy-MM');
            const monthInstallments = installments.filter(i => {
                const dueMonth = format(parseISO(i.due_date), 'yyyy-MM');
                return dueMonth === monthKey && filteredLoans.some(l => l.id === i.loan_id);
            });

            const paid = monthInstallments
                .filter(i => i.paid)
                .reduce((acc, i) => acc + Number(i.amount), 0);

            const pending = monthInstallments
                .filter(i => !i.paid)
                .reduce((acc, i) => acc + Number(i.amount), 0);

            return {
                month: format(month, 'MMM/yy').toUpperCase(),
                paid,
                pending,
                total: paid + pending
            };
        });
    }, [filteredLoans, installments]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const toggleRowExpansion = (itemId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedRows(newExpanded);
    };

    const selectedLoanInstallments = useMemo(() => {
        if (!selectedLoan) return [];
        return installments
            .filter(i => i.loan_id === selectedLoan.id)
            .sort((a, b) => a.installment_number - b.installment_number);
    }, [selectedLoan, installments]);

    if (loading && loans.length === 0) {
        return (
            <div className="w-full px-6 py-6 animate-fade-in">
                <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-600">Carregando empréstimos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-6 py-6 animate-fade-in pb-20">
            {/* Header Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-6 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-blue-900">Operações Ativas</h2>
                            <p className="text-xs text-blue-700">Com notas não quitadas</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{stats.activeLoansCount}</p>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100 p-6 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center border border-violet-200">
                            <TrendingUp className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-violet-900">Total Emprestado</h2>
                            <p className="text-xs text-violet-700">Principal + Juros: {formatCurrency(stats.totalInterest)}</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-violet-900">{formatCurrency(stats.totalBorrowed)}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-6 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-emerald-900">Pago</h2>
                            <p className="text-xs text-emerald-700">Notas quitadas</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">{formatCurrency(stats.totalPaid)}</p>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl border border-rose-100 p-6 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center border border-rose-200">
                            <XCircle className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-rose-900">A Pagar</h2>
                            <p className="text-xs text-rose-700">{stats.overdueInstallments} operação(ões) vencida(s)</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-rose-900">{formatCurrency(stats.totalPending)}</p>
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-2 mb-6 bg-white rounded-xl p-1.5 border border-slate-200">
                <button
                    onClick={() => setActiveView('operations')}
                    className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                        activeView === 'operations'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    Operações
                </button>
                <button
                    onClick={() => setActiveView('control')}
                    className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                        activeView === 'control'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    Lista de Controle
                </button>
            </div>

            {activeView === 'operations' && (
                <>
                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Pesquisar empréstimos..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setShowCashFlowModal(true)}
                            className="px-6 py-3.5 bg-violet-100 text-violet-700 rounded-xl font-bold text-sm hover:bg-violet-200 transition-colors flex items-center gap-2 border border-violet-200"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Fluxo de Caixa
                        </button>
                        <button
                            onClick={() => {
                                setShowNoteExchangeModal(true);
                                setCurrentExchangeId(null);
                                setNoteExchangeData({
                            operation_number: '',
                            interest_rate: '',
                            due_date: format(new Date(), 'yyyy-MM-dd')
                        });
                    }}
                    className="px-6 py-3.5 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-200 transition-colors flex items-center gap-2 border border-amber-200"
                >
                    <Receipt className="w-4 h-4" />
                    Troca de Notas
                </button>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Novo Empréstimo
                </button>
            </div>

            {/* Note Exchanges List */}
            {noteExchanges.filter(e => e.status !== 'effectivated').length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Operações de Troca de Notas</h3>
                    <div className="space-y-4">
                        {noteExchanges.filter(e => e.status !== 'effectivated').map(exchange => {
                            const items = noteExchangeItems.filter(i => i.exchange_id === exchange.id);

                            const itemIds = items.map(i => i.id);
                            const exchangePayments = notePayments.filter(p => itemIds.includes(p.note_exchange_item_id));
                            const totalPaidNotes = exchangePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
                            const totalNoteValue = items.reduce((sum, i) => sum + Number(i.net_amount), 0);
                            const remainingNotes = totalNoteValue - totalPaidNotes;
                            const paidNotesCount = items.filter(item => {
                                const itemPaid = exchangePayments
                                    .filter(p => p.note_exchange_item_id === item.id)
                                    .reduce((sum, p) => sum + Number(p.amount_paid), 0);
                                return Number(item.net_amount) - itemPaid <= 0.01;
                            }).length;

                            return (
                                <div key={exchange.id} className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                                    {remainingNotes <= 0.01 && (
                                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 flex items-center justify-center gap-2">
                                            <span className="text-white font-bold text-sm uppercase tracking-wide">
                                                ✓ Operação Paga
                                            </span>
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Primeira Coluna - Operação */}
                                            <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-bold text-slate-900">Operação {exchange.operation_number}</h3>
                                                        {remainingNotes <= 0.01 && (
                                                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                                QUITADO
                                                            </span>
                                                        )}
                                                        {items.length > 0 && remainingNotes > 0.01 && (
                                                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                                PENDENTE EFETIVAÇÃO
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                        <span>Taxa: {exchange.interest_rate}% a.a.</span>
                                                        <span>Vencimento: {format(parseISO(exchange.due_date), 'dd/MM/yyyy')}</span>
                                                        <span>Notas: {paidNotesCount}/{items.length} pagas</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setCurrentExchangeId(exchange.id);
                                                            setShowNoteExchangeModal(true);
                                                        }}
                                                        className="p-2 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                                                    >
                                                        <Eye className="w-4 h-4 text-amber-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteNoteExchange(exchange.id)}
                                                        className="p-2 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-rose-600" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Total Bruto</p>
                                                    <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(exchange.total_gross_amount))}</p>
                                                </div>
                                                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Total Líquido</p>
                                                    <p className="text-lg font-bold text-emerald-700">{formatCurrency(Number(exchange.total_net_amount))}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Segunda Coluna - Troca de Notas e Controle */}
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Troca de Notas e Seu Controle</h4>
                                                <button
                                                    onClick={() => {
                                                        setSelectedExchange(exchange);
                                                        setShowNoteDetailModal(true);
                                                    }}
                                                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors border border-blue-200 flex items-center gap-2"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Ver Detalhes
                                                </button>
                                            </div>

                                            <div className="space-y-3 mb-4">
                                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Status das Notas</p>
                                                    <p className="text-sm font-bold text-blue-900">{paidNotesCount} de {items.length} notas pagas</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Pago</p>
                                                        <p className="text-sm font-bold text-emerald-700">{formatCurrency(totalPaidNotes)}</p>
                                                    </div>
                                                    <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
                                                        <p className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-1">Saldo</p>
                                                        <p className="text-sm font-bold text-rose-700">{formatCurrency(remainingNotes)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Loans List */}
            <div className="space-y-4">
                {filteredLoans.length > 0 ? (
                    filteredLoans.map(loan => {
                        const loanInstallments = installments.filter(i => i.loan_id === loan.id);
                        const paidCount = loanInstallments.filter(i => i.paid).length;
                        const totalCount = loanInstallments.length;
                        const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
                        const amountPaid = loanInstallments.filter(i => i.paid).reduce((acc, i) => acc + Number(i.amount), 0);
                        const amountPending = loanInstallments.filter(i => !i.paid).reduce((acc, i) => acc + Number(i.amount), 0);
                        const isFullyPaid = amountPending <= 0.01 || loan.status === 'paid';

                        return (
                            <div key={loan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                {isFullyPaid && (
                                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 flex items-center justify-center gap-2">
                                        <span className="text-white font-bold text-sm uppercase tracking-wide">
                                            ✓ Operação Paga
                                        </span>
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-slate-900">{loan.lender}</h3>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                                loan.status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                                {loan.status === 'active' ? 'ATIVO' : 'PAGO'}
                                            </span>
                                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                                {getCompanyShortName(loan.company as Company)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-1">{loan.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>Taxa: {loan.interest_rate}% a.a.</span>
                                            <span>Parcelas: {totalCount}</span>
                                            <span>Início: {format(parseISO(loan.start_date), 'dd/MM/yyyy')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedLoan(loan);
                                                setShowPaymentControlModal(true);
                                            }}
                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                        >
                                            <Eye className="w-4 h-4 text-blue-600" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLoan(loan.id)}
                                            className="p-2 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                                        >
                                            <Trash2 className="w-4 h-4 text-rose-600" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Total Emprestado</p>
                                        <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(loan.total_amount))}</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Pago</p>
                                        <p className="text-lg font-bold text-emerald-700">{formatCurrency(amountPaid)}</p>
                                    </div>
                                    <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                                        <p className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-1">A Pagar</p>
                                        <p className="text-lg font-bold text-rose-700">{formatCurrency(amountPending)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-600">Progresso: {paidCount} de {totalCount} parcelas pagas</span>
                                        <span className="font-bold text-slate-900">{progress.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">Nenhum empréstimo encontrado</p>
                        <p className="text-sm text-slate-400 mt-1">Adicione um novo empréstimo para começar</p>
                    </div>
                )}
            </div>

            {/* Add Loan Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-br from-blue-50 to-cyan-50 border-b border-blue-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                                    <Plus className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-blue-900">Novo Empréstimo</h2>
                                    <p className="text-sm text-blue-700">Preencha os dados do empréstimo</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-blue-50 flex items-center justify-center border border-blue-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-blue-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Empresa</label>
                                <select
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    {COMPANIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Credor *</label>
                                <input
                                    type="text"
                                    value={formData.lender}
                                    onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                                    placeholder="Nome do credor"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Descrição *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrição do empréstimo"
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Valor Total *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.total_amount}
                                        onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Taxa de Juros (% a.a.)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.interest_rate}
                                        onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Data de Início</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Número de Parcelas</label>
                                    <input
                                        type="number"
                                        value={formData.installments_count}
                                        onChange={(e) => setFormData({ ...formData, installments_count: e.target.value })}
                                        min="1"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 p-6 flex gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddLoan}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                Criar Empréstimo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Note Exchange Modal */}
            {showNoteExchangeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-br from-amber-50 to-yellow-50 border-b border-amber-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200">
                                    <Receipt className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-amber-900">
                                        {currentExchangeId ? `Operação ${currentExchange?.operation_number}` : 'Nova Troca de Notas'}
                                    </h2>
                                    <p className="text-sm text-amber-700">
                                        {currentExchangeId ? 'Visualizar e gerenciar notas' : 'Criar nova operação de troca'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowNoteExchangeModal(false);
                                    setCurrentExchangeId(null);
                                }}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-amber-50 flex items-center justify-center border border-amber-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-amber-600" />
                            </button>
                        </div>

                        <div className="p-6">
                            {!currentExchangeId ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Número da Operação *</label>
                                        <input
                                            type="text"
                                            value={noteExchangeData.operation_number}
                                            onChange={(e) => setNoteExchangeData({ ...noteExchangeData, operation_number: e.target.value })}
                                            placeholder="Ex: OP-001"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-100"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Taxa de Juros (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={noteExchangeData.interest_rate}
                                                onChange={(e) => setNoteExchangeData({ ...noteExchangeData, interest_rate: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Data da Operação *</label>
                                            <input
                                                type="date"
                                                value={noteExchangeData.due_date}
                                                onChange={(e) => setNoteExchangeData({ ...noteExchangeData, due_date: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-100"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCreateNoteExchange}
                                        className="w-full px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors"
                                    >
                                        Criar Operação
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Total Bruto</p>
                                            <p className="text-xl font-bold text-slate-900">{formatCurrency(Number(currentExchange?.total_gross_amount || 0))}</p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Total Líquido</p>
                                            <p className="text-xl font-bold text-emerald-700">{formatCurrency(Number(currentExchange?.total_net_amount || 0))}</p>
                                        </div>
                                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Notas</p>
                                            <p className="text-xl font-bold text-amber-900">{currentExchangeItems.length}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-slate-900">Notas Trocadas</h3>
                                        <div className="flex items-center gap-2">
                                            {currentExchangeItems.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedExchange(currentExchange);
                                                        setShowEffectivateModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Efetivar Operação
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowAddNoteModal(true)}
                                                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-sm hover:bg-amber-700 transition-colors flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Adicionar Nota
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {currentExchangeItems.map(item => (
                                            <div key={item.id} className={`rounded-xl p-4 border transition-all ${
                                                item.paid
                                                    ? 'bg-emerald-50 border-emerald-200'
                                                    : 'bg-slate-50 border-slate-200'
                                            }`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <button
                                                            onClick={() => handleToggleNotePaid(item.id, item.paid || false)}
                                                            className={`mt-1 p-2 rounded-lg transition-colors ${
                                                                item.paid
                                                                    ? 'bg-emerald-100 hover:bg-emerald-200 border border-emerald-200'
                                                                    : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                                                            }`}
                                                        >
                                                            {item.paid ? (
                                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-slate-600" />
                                                            )}
                                                        </button>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold border border-blue-200">
                                                                    {item.note_number}
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-600">{getCompanyShortName(item.company as Company)}</span>
                                                                {item.paid && (
                                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold border border-emerald-200">
                                                                        PAGO
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-900">{item.client}</p>
                                                            <p className="text-xs text-slate-600">{item.contract}</p>
                                                            {item.paid && item.payment_date && (
                                                                <p className="text-xs text-emerald-700 mt-1">
                                                                    Pago em: {format(parseISO(item.payment_date), 'dd/MM/yyyy')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteNoteItem(item.id)}
                                                        className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-rose-600" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs ml-14">
                                                    <div>
                                                        <p className="text-slate-500 font-medium mb-0.5">Bruto</p>
                                                        <p className="font-bold text-slate-900">{formatCurrency(Number(item.gross_amount))}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500 font-medium mb-0.5">Líquido</p>
                                                        <p className="font-bold text-emerald-700">{formatCurrency(Number(item.net_amount))}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500 font-medium mb-0.5">Referência</p>
                                                        <p className="font-bold text-slate-900">{item.reference}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500 font-medium mb-0.5">Venc. Original</p>
                                                        <p className="font-bold text-slate-900">{format(parseISO(item.original_due_date), 'dd/MM/yy')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {currentExchangeItems.length === 0 && (
                                            <div className="text-center py-8 text-slate-400">
                                                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                <p className="font-medium">Nenhuma nota adicionada</p>
                                                <p className="text-sm mt-1">Clique em "Adicionar Nota" para começar</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Note Item Modal */}
            {showAddNoteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-br from-blue-50 to-cyan-50 border-b border-blue-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                                    <Plus className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-blue-900">Adicionar Nota</h2>
                                    <p className="text-sm text-blue-700">Preencha os dados da nota trocada</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddNoteModal(false)}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-blue-50 flex items-center justify-center border border-blue-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-blue-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Empresa</label>
                                <select
                                    value={noteItemData.company}
                                    onChange={(e) => setNoteItemData({ ...noteItemData, company: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    {COMPANIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cliente (Centro de Custo) *</label>
                                <ClientSelector
                                    value={noteItemData.client}
                                    onChange={(clientName) => setNoteItemData({ ...noteItemData, client: clientName })}
                                    supabaseClient={supabaseClient}
                                    placeholder="Selecione ou digite o nome do cliente"
                                    className="w-full"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Valor Bruto *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={noteItemData.gross_amount}
                                        onChange={(e) => setNoteItemData({ ...noteItemData, gross_amount: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Valor Líquido *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={noteItemData.net_amount}
                                        onChange={(e) => setNoteItemData({ ...noteItemData, net_amount: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Observações</label>
                                    <input
                                        type="text"
                                        value={noteItemData.reference}
                                        onChange={(e) => setNoteItemData({ ...noteItemData, reference: e.target.value })}
                                        placeholder="Adicione observações sobre esta nota (opcional)"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Vencimento Original</label>
                                    <input
                                        type="date"
                                        value={noteItemData.original_due_date}
                                        onChange={(e) => setNoteItemData({ ...noteItemData, original_due_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Número da Nota *</label>
                                <input
                                    type="text"
                                    value={noteItemData.note_number}
                                    onChange={(e) => setNoteItemData({ ...noteItemData, note_number: e.target.value })}
                                    placeholder="Ex: NF-12345"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div className="border-t border-slate-100 p-6 flex gap-3">
                            <button
                                onClick={() => setShowAddNoteModal(false)}
                                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddNoteItem}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                Adicionar Nota
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedLoan && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-br from-violet-50 to-purple-50 border-b border-violet-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center border border-violet-200">
                                    <Eye className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-violet-900">{selectedLoan.lender}</h2>
                                    <p className="text-sm text-violet-700">{selectedLoan.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedLoan(null);
                                }}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-violet-50 flex items-center justify-center border border-violet-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-violet-600" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Valor Total</p>
                                    <p className="text-xl font-bold text-slate-900">{formatCurrency(Number(selectedLoan.total_amount))}</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Taxa de Juros</p>
                                    <p className="text-xl font-bold text-blue-900">{selectedLoan.interest_rate}% a.a.</p>
                                </div>
                                <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                                    <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-1">Parcelas</p>
                                    <p className="text-xl font-bold text-violet-900">{selectedLoan.installments_count}x</p>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-4">Parcelas</h3>
                            <div className="space-y-2">
                                {selectedLoanInstallments.map(installment => (
                                    <div
                                        key={installment.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                            installment.paid
                                                ? 'bg-emerald-50 border-emerald-200'
                                                : new Date(installment.due_date) < new Date()
                                                ? 'bg-rose-50 border-rose-200'
                                                : 'bg-white border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                                                installment.paid
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                                {installment.installment_number}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    Vencimento: {format(parseISO(installment.due_date), 'dd/MM/yyyy')}
                                                </p>
                                                {installment.paid && installment.payment_date && (
                                                    <p className="text-xs text-emerald-700">
                                                        Pago em: {format(parseISO(installment.payment_date), 'dd/MM/yyyy')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(installment.amount))}</p>
                                            <button
                                                onClick={() => handleToggleInstallmentPaid(installment.id, installment.paid)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    installment.paid
                                                        ? 'bg-emerald-100 hover:bg-emerald-200 border border-emerald-200'
                                                        : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                                                }`}
                                            >
                                                {installment.paid ? (
                                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-slate-600" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cash Flow Modal */}
            {showCashFlowModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-br from-violet-50 to-purple-50 border-b border-violet-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center border border-violet-200">
                                    <BarChart3 className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-violet-900">Fluxo de Caixa - Empréstimos</h2>
                                    <p className="text-sm text-violet-700">Próximos 12 meses</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCashFlowModal(false)}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-violet-50 flex items-center justify-center border border-violet-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-violet-600" />
                            </button>
                        </div>

                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={400}>
                                <ComposedChart data={cashFlowData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                    <YAxis stroke="#64748b" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '0.75rem',
                                            padding: '12px',
                                            fontSize: '14px',
                                            fontWeight: 600
                                        }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Legend />
                                    <Bar dataKey="paid" fill="#10b981" name="Pago" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="pending" fill="#ef4444" name="A Pagar" radius={[8, 8, 0, 0]} />
                                    <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} name="Total" />
                                </ComposedChart>
                            </ResponsiveContainer>

                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Total Pago</p>
                                    <p className="text-2xl font-bold text-emerald-900">
                                        {formatCurrency(cashFlowData.reduce((acc, d) => acc + d.paid, 0))}
                                    </p>
                                </div>
                                <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-1">Total a Pagar</p>
                                    <p className="text-2xl font-bold text-rose-900">
                                        {formatCurrency(cashFlowData.reduce((acc, d) => acc + d.pending, 0))}
                                    </p>
                                </div>
                                <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                                    <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-1">Total Geral</p>
                                    <p className="text-2xl font-bold text-violet-900">
                                        {formatCurrency(cashFlowData.reduce((acc, d) => acc + d.total, 0))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
                </>
            )}

            {activeView === 'control' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Lista de Controle de Notas</h3>

                    {noteExchangeItems.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-600 font-medium">Nenhuma nota registrada</p>
                            <p className="text-sm text-slate-400 mt-1">Crie operações de troca de notas para começar</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Vencimento</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Operação</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Nota</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Cliente</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wide">Valor Trocado</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wide">Valor Quitado</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wide">Valor em Aberto</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wide">Status</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wide">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {noteExchangeItems.map(item => {
                                            const exchange = noteExchanges.find(e => e.id === item.exchange_id);
                                            const itemPayments = notePayments.filter(p => p.note_exchange_item_id === item.id);
                                            const totalPaid = itemPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
                                            const remaining = Number(item.net_amount) - totalPaid;
                                            const isPaid = remaining <= 0.01;
                                            const isExpanded = expandedRows.has(item.id);

                                            return (
                                                <React.Fragment key={item.id}>
                                                <tr className={`hover:bg-slate-50 transition-colors ${isPaid ? 'bg-emerald-50/30' : ''} cursor-pointer`}
                                                    onClick={() => toggleRowExpansion(item.id)}>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm font-bold text-slate-900">
                                                            {format(parseISO(item.original_due_date), 'dd/MM/yyyy')}
                                                        </div>
                                                        {exchange && new Date(exchange.due_date) < new Date() && !isPaid && (
                                                            <span className="text-xs text-rose-600 font-bold">VENCIDO</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm font-bold text-slate-900">
                                                            {exchange?.operation_number || 'N/A'}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            Taxa: {exchange?.interest_rate || 0}%
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                                                {item.note_number}
                                                            </span>
                                                            <span className="text-xs text-slate-600">
                                                                {getCompanyShortName(item.company as Company)}
                                                            </span>
                                                        </div>
                                                        {item.reference && (
                                                            <div className="text-xs text-slate-500 mt-1">
                                                                Ref: {item.reference}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm font-bold text-slate-900">{item.client}</div>
                                                        <div className="text-xs text-slate-500">{item.contract}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="text-sm font-bold text-slate-900">
                                                            {formatCurrency(Number(item.net_amount))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="text-sm font-bold text-emerald-700">
                                                            {formatCurrency(totalPaid)}
                                                        </div>
                                                        {itemPayments.length > 0 && (
                                                            <div className="text-xs text-slate-500">
                                                                {itemPayments.length} pgto(s)
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className={`text-sm font-bold ${remaining > 0.01 ? 'text-rose-700' : 'text-slate-400'}`}>
                                                            {formatCurrency(remaining)}
                                                        </div>
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
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (exchange) {
                                                                        setSelectedExchange(exchange);
                                                                        setShowNoteDetailModal(true);
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                                                title="Ver detalhes"
                                                            >
                                                                <Eye className="w-4 h-4 text-blue-600" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {isExpanded && itemPayments.length > 0 && (
                                                    <tr className="bg-slate-50/50">
                                                        <td colSpan={9} className="px-4 py-4">
                                                            <div className="bg-white rounded-xl p-4 border border-slate-200">
                                                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4" />
                                                                    Histórico de Quitações
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    {itemPayments.map((payment, idx) => {
                                                                        const paymentNote = payment.payment_note;
                                                                        return (
                                                                            <div key={payment.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-3 mb-1">
                                                                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                                                                                            Pagamento {idx + 1}
                                                                                        </span>
                                                                                        <span className="text-sm font-bold text-slate-900">
                                                                                            {format(parseISO(payment.payment_date), 'dd/MM/yyyy')}
                                                                                        </span>
                                                                                        <span className="text-sm font-bold text-emerald-700">
                                                                                            {formatCurrency(Number(payment.amount_paid))}
                                                                                        </span>
                                                                                    </div>
                                                                                    {paymentNote && (
                                                                                        <div className="flex items-center gap-4 text-xs text-slate-600 mt-2 pl-2 border-l-2 border-blue-200">
                                                                                            <span>
                                                                                                <span className="font-bold text-slate-700">Nota Usada:</span> {paymentNote.note_number}
                                                                                            </span>
                                                                                            <span>
                                                                                                <span className="font-bold text-slate-700">Cliente:</span> {paymentNote.client_name}
                                                                                            </span>
                                                                                            {paymentNote.reference && (
                                                                                                <span>
                                                                                                    <span className="font-bold text-slate-700">Ref:</span> {paymentNote.reference}
                                                                                                </span>
                                                                                            )}
                                                                                            <span>
                                                                                                <span className="font-bold text-slate-700">Valor Total da Nota:</span> {formatCurrency(Number(paymentNote.total_amount))}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {itemPayments.length > 1 && (
                                                                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                                                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                                                            Total de {itemPayments.length} quitações
                                                                        </span>
                                                                        <span className="text-sm font-bold text-emerald-700">
                                                                            Total: {formatCurrency(totalPaid)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}

                                                {isExpanded && itemPayments.length === 0 && (
                                                    <tr className="bg-slate-50/50">
                                                        <td colSpan={9} className="px-4 py-3">
                                                            <div className="bg-white rounded-xl p-4 border border-slate-200 text-center text-sm text-slate-500">
                                                                Nenhuma quitação registrada para esta nota
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

                            {/* Resumo ao final da tabela */}
                            <div className="bg-slate-50 border-t border-slate-200 px-4 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Total Notas</p>
                                        <p className="text-lg font-bold text-slate-900">{noteExchangeItems.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Valor Total Trocado</p>
                                        <p className="text-lg font-bold text-slate-900">
                                            {formatCurrency(noteExchangeItems.reduce((sum, i) => sum + Number(i.net_amount), 0))}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Total Quitado</p>
                                        <p className="text-lg font-bold text-emerald-700">
                                            {formatCurrency(notePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0))}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-1">Total em Aberto</p>
                                        <p className="text-lg font-bold text-rose-700">
                                            {formatCurrency(
                                                noteExchangeItems.reduce((sum, i) => {
                                                    const paid = notePayments
                                                        .filter(p => p.note_exchange_item_id === i.id)
                                                        .reduce((s, p) => s + Number(p.amount_paid), 0);
                                                    return sum + (Number(i.net_amount) - paid);
                                                }, 0)
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}


            {/* Note Exchange Detail Modal */}
            {showNoteDetailModal && selectedExchange && (
                <NoteExchangeDetailModal
                    exchangeId={selectedExchange.id}
                    operationNumber={selectedExchange.operation_number}
                    supabaseClient={supabaseClient}
                    onClose={() => {
                        setShowNoteDetailModal(false);
                        setSelectedExchange(null);
                        fetchData();
                    }}
                />
            )}

            {/* Effectivate Exchange Modal */}
            {showEffectivateModal && selectedExchange && (
                <EffectivateExchangeModal
                    operationNumber={selectedExchange.operation_number}
                    totalNetAmount={Number(selectedExchange.total_net_amount)}
                    interestRate={selectedExchange.interest_rate}
                    startDate={selectedExchange.due_date}
                    onClose={() => {
                        setShowEffectivateModal(false);
                        setSelectedExchange(null);
                    }}
                    onConfirm={handleEffectivateExchange}
                />
            )}

            {/* Loan Payment Control Modal */}
            {showPaymentControlModal && selectedLoan && (
                <LoanPaymentControlModal
                    loanId={selectedLoan.id}
                    loanName={selectedLoan.lender}
                    supabaseClient={supabaseClient}
                    onClose={() => {
                        setShowPaymentControlModal(false);
                        setSelectedLoan(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};

export default LoansTab;

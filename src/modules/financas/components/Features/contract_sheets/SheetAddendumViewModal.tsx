import React, { useEffect, useState } from 'react';
import { X, Calendar, FileText, TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { ContractSheet } from '../../../types';
import { formatCurrency } from '../../../utils';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

interface Addendum {
    id: string;
    addendum_number: number;
    effective_date: string;
    created_at: string;
    created_by: string;
    description: string | null;
    items: AddendumItem[];
}

interface AddendumItem {
    category_code: string;
    category_name: string;
    budgeted_amount: number;
    client_name: string;
}

interface SheetAddendumViewModalProps {
    sheet: ContractSheet;
    supabaseClient: SupabaseClient | null;
    onClose: () => void;
    onEdit?: (addendum: Addendum) => void;
}

export const SheetAddendumViewModal: React.FC<SheetAddendumViewModalProps> = ({
    sheet,
    supabaseClient,
    onClose,
    onEdit
}) => {
    const [addendums, setAddendums] = useState<Addendum[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAddendum, setSelectedAddendum] = useState<Addendum | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (supabaseClient) {
            loadAddendums();
        }
    }, [sheet.id, supabaseClient]);

    const loadAddendums = async () => {
        if (!supabaseClient) {
            console.error('Supabase client não disponível');
            return;
        }

        try {
            const { data: addendumsData, error: addendumsError } = await supabaseClient
                .from('contract_sheet_addendums')
                .select('*')
                .eq('sheet_id', sheet.id)
                .order('addendum_number', { ascending: true });

            if (addendumsError) throw addendumsError;

            if (addendumsData && addendumsData.length > 0) {
                const addendumsWithItems = await Promise.all(
                    addendumsData.map(async (addendum) => {
                        const { data: items, error: itemsError } = await supabaseClient
                            .from('contract_sheet_addendum_items')
                            .select('*')
                            .eq('addendum_id', addendum.id)
                            .order('category_code');

                        if (itemsError) throw itemsError;

                        return {
                            ...addendum,
                            items: items || []
                        };
                    })
                );

                setAddendums(addendumsWithItems);
            }
        } catch (error) {
            console.error('Error loading addendums:', error);
            alert('Erro ao carregar aditivos');
        } finally {
            setLoading(false);
        }
    };

    const getOriginalAmount = (categoryCode: string): number => {
        const item = sheet.items.find(i => i.category_code === categoryCode);
        return item?.budgeted_amount || 0;
    };

    const getPreviousAmount = (addendumNumber: number, categoryCode: string): number => {
        if (addendumNumber === 1) {
            return getOriginalAmount(categoryCode);
        }

        const previousAddendum = addendums.find(a => a.addendum_number === addendumNumber - 1);
        if (previousAddendum) {
            const item = previousAddendum.items.find(i => i.category_code === categoryCode);
            return item?.budgeted_amount || 0;
        }

        return getOriginalAmount(categoryCode);
    };

    const handleDelete = async (addendum: Addendum) => {
        if (!supabaseClient) return;

        const confirmDelete = window.confirm(
            `Tem certeza que deseja excluir o Aditivo ${addendum.addendum_number}?\n\n` +
            `Esta ação não pode ser desfeita e todos os valores orçados deste aditivo serão removidos.`
        );

        if (!confirmDelete) return;

        setDeletingId(addendum.id);

        try {
            // Deletar primeiro os itens do aditivo
            const { error: itemsError } = await supabaseClient
                .from('contract_sheet_addendum_items')
                .delete()
                .eq('addendum_id', addendum.id);

            if (itemsError) throw itemsError;

            // Depois deletar o aditivo
            const { error: addendumError } = await supabaseClient
                .from('contract_sheet_addendums')
                .delete()
                .eq('id', addendum.id);

            if (addendumError) throw addendumError;

            // Recarregar lista
            await loadAddendums();

            alert('Aditivo excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting addendum:', error);
            alert('Erro ao excluir aditivo. Tente novamente.');
        } finally {
            setDeletingId(null);
        }
    };


    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-white rounded-2xl shadow-2xl p-8">
                    <p className="text-slate-600">Carregando histórico...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Histórico de Aditivos</h2>
                            <p className="text-blue-100 mt-1">Ficha: {sheet.client_name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {addendums.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg">Nenhum aditivo criado ainda</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 rounded-xl p-4 mb-6">
                                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Ficha Original
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-700">Data de Início:</span>
                                        <span className="ml-2 font-semibold text-blue-900">
                                            {format(new Date(sheet.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-blue-700">Total Orçado:</span>
                                        <span className="ml-2 font-semibold text-blue-900">
                                            {formatCurrency(sheet.items.reduce((sum, item) => sum + item.budgeted_amount, 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {addendums.map((addendum) => {
                                const isSelected = selectedAddendum?.id === addendum.id;
                                const total = addendum.items.reduce((sum, item) => sum + item.budgeted_amount, 0);
                                const previousTotal = addendum.items.reduce((sum, item) =>
                                    sum + getPreviousAmount(addendum.addendum_number, item.category_code), 0
                                );
                                const totalChange = total - previousTotal;
                                const isDeleting = deletingId === addendum.id;

                                return (
                                    <div key={addendum.id} className="border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="bg-slate-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className="flex items-center gap-4 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => setSelectedAddendum(isSelected ? null : addendum)}
                                                >
                                                    <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                                                        {addendum.addendum_number}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-900">Aditivo {addendum.addendum_number}</h4>
                                                        <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                Vigência: {format(new Date(addendum.effective_date), "dd/MM/yyyy")}
                                                            </span>
                                                            <span>
                                                                Criado por: {addendum.created_by}
                                                            </span>
                                                        </div>
                                                        {addendum.description && (
                                                            <div className="text-sm text-slate-600 mt-2 italic">
                                                                {addendum.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-slate-900">
                                                            {formatCurrency(total)}
                                                        </div>
                                                        {totalChange !== 0 && (
                                                            <div className={`text-sm font-semibold flex items-center justify-end gap-1 ${totalChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {totalChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                                {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onEdit) {
                                                                    onEdit(addendum);
                                                                }
                                                            }}
                                                            disabled={isDeleting || !onEdit}
                                                            className={`p-2 rounded-lg transition-colors ${
                                                                onEdit
                                                                    ? 'hover:bg-blue-100 text-blue-600'
                                                                    : 'text-slate-300 cursor-not-allowed'
                                                            } disabled:opacity-50`}
                                                            title={onEdit ? "Editar aditivo" : "Edição não disponível"}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(addendum);
                                                            }}
                                                            disabled={isDeleting}
                                                            className="p-2 hover:bg-rose-100 rounded-lg transition-colors text-rose-600 disabled:opacity-50"
                                                            title="Excluir aditivo"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="p-4 bg-white border-t border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-slate-200">
                                                            <th className="text-left py-2 px-2 text-slate-700">Categoria</th>
                                                            <th className="text-right py-2 px-2 text-slate-700">Anterior</th>
                                                            <th className="text-right py-2 px-2 text-slate-700">Novo Valor</th>
                                                            <th className="text-right py-2 px-2 text-slate-700">Diferença</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {addendum.items.map((item) => {
                                                            const previous = getPreviousAmount(addendum.addendum_number, item.category_code);
                                                            const diff = item.budgeted_amount - previous;

                                                            return (
                                                                <tr key={item.category_code} className="border-b border-slate-100">
                                                                    <td className="py-2 px-2 text-slate-900">
                                                                        <div className="font-medium">{item.category_name}</div>
                                                                        <div className="text-xs text-slate-500">{item.category_code}</div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-right text-slate-600">
                                                                        {formatCurrency(previous)}
                                                                    </td>
                                                                    <td className={`py-2 px-2 text-right font-semibold ${item.budgeted_amount >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                                                        {formatCurrency(item.budgeted_amount)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-right">
                                                                        {diff !== 0 ? (
                                                                            <span className={`font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-400">-</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

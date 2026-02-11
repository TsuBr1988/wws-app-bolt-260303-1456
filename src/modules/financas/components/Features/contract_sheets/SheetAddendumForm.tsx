import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Plus, Minus } from 'lucide-react';
import { ContractSheet, CoaNode } from '../../../types';
import { formatCurrency } from '../../../utils';
import { SupabaseClient } from '@supabase/supabase-js';

interface ExistingAddendum {
    id: string;
    addendum_number: number;
    effective_date: string;
    description: string | null;
    items: Array<{
        category_code: string;
        category_name: string;
        budgeted_amount: number;
        start_date?: string;
        end_date?: string;
    }>;
}

interface SheetAddendumFormProps {
    sheet: ContractSheet;
    supabaseClient: SupabaseClient | null;
    chartOfAccountsTree: CoaNode[];
    existingAddendum?: ExistingAddendum;
    onClose: () => void;
    onSuccess: () => void;
}

interface AddendumItem {
    category_code: string;
    budgeted_amount: number;
}

interface Category {
    code: string;
    name: string;
}

export const SheetAddendumForm: React.FC<SheetAddendumFormProps> = ({
    sheet,
    supabaseClient,
    chartOfAccountsTree,
    existingAddendum,
    onClose,
    onSuccess
}) => {
    const [effectiveDate, setEffectiveDate] = useState(existingAddendum?.effective_date || '');
    const [endDate, setEndDate] = useState(existingAddendum?.items[0]?.end_date || '');
    const [description, setDescription] = useState(existingAddendum?.description || '');
    const [budgetedAmounts, setBudgetedAmounts] = useState<Record<string, number>>({});
    const [inputValues, setInputValues] = useState<Record<string, string>>({});
    const [percentageIncrease, setPercentageIncrease] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastAddendumItems, setLastAddendumItems] = useState<AddendumItem[]>([]);
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
    const [addedCategories, setAddedCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    // Função auxiliar para coletar todas as categorias folha (leaf nodes) da árvore
    const collectLeafNodes = (nodes: CoaNode[]): Category[] => {
        const leaves: Category[] = [];
        const traverse = (node: CoaNode) => {
            if (node.isLeaf) {
                // É uma folha (leaf node)
                leaves.push({ code: node.code, name: node.name });
            }
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => traverse(child));
            }
        };
        nodes.forEach(node => traverse(node));
        return leaves;
    };

    // Buscar o último aditivo e categorias disponíveis ao carregar o componente
    useEffect(() => {
        if (!supabaseClient) return;

        const loadData = async () => {
            try {
                // Se estamos editando, usar os itens do aditivo existente
                if (existingAddendum) {
                    const amounts: Record<string, number> = {};
                    existingAddendum.items.forEach(item => {
                        amounts[item.category_code] = item.budgeted_amount;
                    });
                    setBudgetedAmounts(amounts);

                    // Identificar quais categorias foram adicionadas neste aditivo
                    const originalCodes = sheet.items?.map(item => item.category_code) || [];
                    const addedInThisAddendum = existingAddendum.items.filter(item =>
                        !originalCodes.includes(item.category_code)
                    );

                    const allLeafCategories = collectLeafNodes(chartOfAccountsTree);
                    const addedCategs = addedInThisAddendum.map(item => ({
                        code: item.category_code,
                        name: item.category_name
                    }));
                    setAddedCategories(addedCategs);

                    // Categorias disponíveis são aquelas que não estão nem na ficha nem no aditivo
                    const usedCodes = [...originalCodes, ...addedCategs.map(c => c.code)];
                    const available = allLeafCategories.filter(cat => !usedCodes.includes(cat.code));
                    setAvailableCategories(available);
                } else {
                    // Buscar o aditivo mais recente
                    const { data: lastAddendum } = await supabaseClient
                        .from('contract_sheet_addendums')
                        .select('id, addendum_number')
                        .eq('sheet_id', sheet.id)
                        .order('addendum_number', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (lastAddendum) {
                        // Buscar os itens do último aditivo
                        const { data: items } = await supabaseClient
                            .from('contract_sheet_addendum_items')
                            .select('category_code, budgeted_amount')
                            .eq('addendum_id', lastAddendum.id);

                        if (items && items.length > 0) {
                            setLastAddendumItems(items);
                        }
                    }

                    // Coletar todas as categorias folha da árvore
                    const allLeafCategories = collectLeafNodes(chartOfAccountsTree);

                    // Filtrar categorias que já não estão na ficha
                    const existingCodes = sheet.items?.map(item => item.category_code) || [];
                    const available = allLeafCategories.filter(cat => !existingCodes.includes(cat.code));
                    setAvailableCategories(available);
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            }
        };

        loadData();
    }, [sheet.id, sheet.items, supabaseClient, chartOfAccountsTree, existingAddendum]);

    const initialAmounts = useMemo(() => {
        const amounts: Record<string, number> = {};

        // Se houver um último aditivo, usar seus valores
        if (lastAddendumItems.length > 0) {
            lastAddendumItems.forEach(item => {
                amounts[item.category_code] = item.budgeted_amount;
            });
        } else {
            // Caso contrário, usar os valores da ficha original
            sheet.items?.forEach(item => {
                amounts[item.category_code] = item.budgeted_amount;
            });
        }

        return amounts;
    }, [lastAddendumItems, sheet.items]);

    const getBudgetedAmount = (code: string): number => {
        return budgetedAmounts[code] ?? initialAmounts[code] ?? 0;
    };

    const handleAmountChange = (code: string, value: string) => {
        const cleanValue = value.replace(/[^\d,-]/g, '');
        const isNegative = cleanValue.startsWith('-');
        const numbersOnly = cleanValue.replace(/-/g, '');
        const finalValue = isNegative ? '-' + numbersOnly : numbersOnly;

        setInputValues(prev => ({ ...prev, [code]: finalValue }));

        const numValue = parseFloat(finalValue.replace(/\./g, '').replace(',', '.')) || 0;
        setBudgetedAmounts(prev => ({ ...prev, [code]: numValue }));
    };

    const handleAmountBlur = (code: string) => {
        const amount = budgetedAmounts[code] || 0;
        if (amount !== 0) {
            setInputValues(prev => ({
                ...prev,
                [code]: amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }));
        } else {
            setInputValues(prev => ({
                ...prev,
                [code]: ''
            }));
        }
    };

    const handleDateChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value) {
            // Input type="date" retorna no formato YYYY-MM-DD
            // Vamos garantir que a data seja interpretada no fuso horário local
            const [year, month, day] = value.split('-').map(Number);
            const localDate = new Date(year, month - 1, day);
            const isoString = localDate.toISOString().split('T')[0];
            setter(isoString);
        } else {
            setter('');
        }
    };

    const handleAddCategory = () => {
        if (!selectedCategory) {
            alert('Por favor, selecione uma categoria');
            return;
        }

        const category = availableCategories.find(cat => cat.code === selectedCategory);
        if (category) {
            setAddedCategories(prev => [...prev, category]);
            setAvailableCategories(prev => prev.filter(cat => cat.code !== selectedCategory));
            setBudgetedAmounts(prev => ({ ...prev, [category.code]: 0 }));
            setSelectedCategory('');
        }
    };

    const handleRemoveCategory = (code: string) => {
        const category = addedCategories.find(cat => cat.code === code);
        if (category) {
            setAddedCategories(prev => prev.filter(cat => cat.code !== code));
            setAvailableCategories(prev => [...prev, category].sort((a, b) => a.code.localeCompare(b.code)));
            setBudgetedAmounts(prev => {
                const updated = { ...prev };
                delete updated[code];
                return updated;
            });
        }
    };

    const applyPercentageIncrease = () => {
        const percentage = parseFloat(percentageIncrease.replace(',', '.'));
        if (isNaN(percentage) || percentage === 0) {
            alert('Por favor, informe um percentual válido');
            return;
        }

        const newAmounts: Record<string, number> = {};
        sheet.items.forEach(item => {
            const original = initialAmounts[item.category_code] || 0;
            const newValue = original * (1 + percentage / 100);
            newAmounts[item.category_code] = Math.round(newValue * 100) / 100;
        });

        setBudgetedAmounts(newAmounts);
    };

    const handleSave = async () => {
        if (!effectiveDate) {
            alert('Por favor, preencha a data de início.');
            return;
        }

        if (!endDate) {
            alert('Por favor, preencha a data de fim dos valores orçados.');
            return;
        }

        if (endDate < effectiveDate) {
            alert('A data de fim deve ser posterior à data de início.');
            return;
        }

        if (!supabaseClient) {
            alert('ERRO: Cliente Supabase não inicializado!\n\nVerifique a conexão nas configurações.');
            return;
        }

        setLoading(true);
        try {
            if (existingAddendum) {
                // MODO EDIÇÃO - Atualizar aditivo existente
                console.log('Atualizando aditivo:', existingAddendum.id);

                // Atualizar o aditivo
                const { error: addendumError } = await supabaseClient
                    .from('contract_sheet_addendums')
                    .update({
                        effective_date: effectiveDate,
                        description: description || null
                    })
                    .eq('id', existingAddendum.id);

                if (addendumError) {
                    console.error('Erro ao atualizar aditivo:', addendumError);
                    throw addendumError;
                }

                // Deletar todos os itens antigos
                const { error: deleteError } = await supabaseClient
                    .from('contract_sheet_addendum_items')
                    .delete()
                    .eq('addendum_id', existingAddendum.id);

                if (deleteError) {
                    console.error('Erro ao deletar itens antigos:', deleteError);
                    throw deleteError;
                }

                // Itens existentes da ficha original
                const existingItems = sheet.items.map(item => ({
                    addendum_id: existingAddendum.id,
                    category_code: item.category_code,
                    category_name: item.category_name,
                    budgeted_amount: getBudgetedAmount(item.category_code),
                    client_name: sheet.client_name,
                    start_date: effectiveDate,
                    end_date: endDate
                }));

                // Itens de categorias adicionadas neste aditivo
                const newItems = addedCategories.map(category => ({
                    addendum_id: existingAddendum.id,
                    category_code: category.code,
                    category_name: category.name,
                    budgeted_amount: getBudgetedAmount(category.code),
                    client_name: sheet.client_name,
                    start_date: effectiveDate,
                    end_date: endDate
                }));

                // Combinar todos os itens
                const items = [...existingItems, ...newItems];

                console.log(`Inserindo ${items.length} itens atualizados...`);

                const { error: itemsError } = await supabaseClient
                    .from('contract_sheet_addendum_items')
                    .insert(items);

                if (itemsError) {
                    console.error('Erro ao inserir itens atualizados:', itemsError);
                    throw itemsError;
                }

                console.log('Aditivo atualizado com sucesso');
                alert(`Aditivo ${existingAddendum.addendum_number} atualizado com sucesso!`);
                onSuccess();
                onClose();
            } else {
                // MODO CRIAÇÃO - Criar novo aditivo
                console.log('Criando aditivo para sheet_id:', sheet.id);

                const { data: existingAddendums } = await supabaseClient
                    .from('contract_sheet_addendums')
                    .select('addendum_number')
                    .eq('sheet_id', sheet.id)
                    .order('addendum_number', { ascending: false })
                    .limit(1);

                const nextAddendumNumber = existingAddendums && existingAddendums.length > 0
                    ? existingAddendums[0].addendum_number + 1
                    : 1;

                console.log('Próximo número de aditivo:', nextAddendumNumber);

                const { data: addendum, error: addendumError } = await supabaseClient
                    .from('contract_sheet_addendums')
                    .insert({
                        sheet_id: sheet.id,
                        addendum_number: nextAddendumNumber,
                        effective_date: effectiveDate,
                        created_by: 'system',
                        description: description || null
                    })
                    .select()
                    .single();

                if (addendumError) {
                    console.error('Erro ao criar aditivo:', addendumError);
                    throw addendumError;
                }

                console.log('Aditivo criado:', addendum);

                // Itens existentes da ficha original
                const existingItems = sheet.items.map(item => ({
                    addendum_id: addendum.id,
                    category_code: item.category_code,
                    category_name: item.category_name,
                    budgeted_amount: getBudgetedAmount(item.category_code),
                    client_name: sheet.client_name,
                    start_date: effectiveDate,
                    end_date: endDate
                }));

                // Itens de categorias adicionadas neste aditivo
                const newItems = addedCategories.map(category => ({
                    addendum_id: addendum.id,
                    category_code: category.code,
                    category_name: category.name,
                    budgeted_amount: getBudgetedAmount(category.code),
                    client_name: sheet.client_name,
                    start_date: effectiveDate,
                    end_date: endDate
                }));

                // Combinar todos os itens
                const items = [...existingItems, ...newItems];

                console.log(`Inserindo ${items.length} itens do aditivo...`);

                const { error: itemsError } = await supabaseClient
                    .from('contract_sheet_addendum_items')
                    .insert(items);

                if (itemsError) {
                    console.error('Erro ao inserir itens do aditivo:', itemsError);
                    throw itemsError;
                }

                console.log('Itens do aditivo inseridos com sucesso');
                alert(`Aditivo ${nextAddendumNumber} criado com sucesso!`);
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            console.error('Error saving addendum:', error);

            // Mensagem de erro mais detalhada
            const errorMessage = error?.message || 'Erro desconhecido';
            const errorDetails = error?.details || '';
            const errorHint = error?.hint || '';

            let userMessage = existingAddendum
                ? 'Erro ao atualizar aditivo:\n\n' + errorMessage
                : 'Erro ao criar aditivo:\n\n' + errorMessage;

            if (errorDetails) userMessage += '\n\nDetalhes: ' + errorDetails;
            if (errorHint) userMessage += '\n\nDica: ' + errorHint;

            // Caso específico: ficha não existe
            if (errorMessage.includes('is not present in table')) {
                userMessage = 'ERRO: A ficha não existe no banco de dados!\n\n' +
                    'Isso pode acontecer porque:\n' +
                    '1. A ficha foi criada apenas no frontend mas não foi salva\n' +
                    '2. A ficha foi deletada mas você ainda está vendo ela em cache\n\n' +
                    'SOLUÇÃO: Recarregue a página (F5) e crie a ficha novamente.';
            }

            alert(userMessage);

            console.error('Detalhes completos do erro:', {
                message: error?.message,
                details: error?.details,
                hint: error?.hint,
                code: error?.code,
                sheet_id: sheet.id
            });
        } finally {
            setLoading(false);
        }
    };

    const totalBudgeted = useMemo(() => {
        const existingTotal = sheet.items.reduce((sum, item) => sum + getBudgetedAmount(item.category_code), 0);
        const addedTotal = addedCategories.reduce((sum, cat) => sum + getBudgetedAmount(cat.code), 0);
        return existingTotal + addedTotal;
    }, [budgetedAmounts, sheet.items, addedCategories]);

    const totalChange = useMemo(() => {
        const existingChange = sheet.items.reduce((sum, item) => {
            const original = initialAmounts[item.category_code] || 0;
            const current = getBudgetedAmount(item.category_code);
            return sum + (current - original);
        }, 0);
        const addedChange = addedCategories.reduce((sum, cat) => {
            return sum + getBudgetedAmount(cat.code);
        }, 0);
        return existingChange + addedChange;
    }, [budgetedAmounts, sheet.items, addedCategories, initialAmounts]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">
                                {existingAddendum ? `Editar Aditivo ${existingAddendum.addendum_number}` : 'Criar Aditivo'}
                            </h2>
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
                    <div className="space-y-6">
                        <div className="bg-blue-50 rounded-xl p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-2" />
                                        Data de Início
                                    </label>
                                    <input
                                        type="date"
                                        value={effectiveDate}
                                        onChange={handleDateChange(setEffectiveDate)}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-2" />
                                        Data de Fim
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={handleDateChange(setEndDate)}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Descrição (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ex: Reajuste anual, Alteração de escopo, etc."
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    maxLength={200}
                                />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-5 border border-emerald-200">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Aplicar Percentual de Reajuste
                                    </label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={percentageIncrease}
                                            onChange={(e) => setPercentageIncrease(e.target.value)}
                                            placeholder="Ex: 5.5 para 5,5%"
                                            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={applyPercentageIncrease}
                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors whitespace-nowrap"
                                        >
                                            Aplicar %
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-2">
                                        Use valores positivos para aumentar (ex: 5.5) ou negativos para diminuir (ex: -3.2)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                            <h4 className="text-md font-bold text-slate-900 mb-3">
                                <Plus className="w-4 h-4 inline mr-2" />
                                Adicionar Nova Categoria
                            </h4>
                            <p className="text-xs text-slate-600 mb-3">
                                Adicione categorias que não existiam na ficha original mas fazem parte deste aditivo
                            </p>
                            <div className="flex gap-3">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                    <option value="">Selecione uma categoria...</option>
                                    {availableCategories.map(cat => (
                                        <option key={cat.code} value={cat.code}>
                                            {cat.code} - {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAddCategory}
                                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4 inline mr-1" />
                                    Adicionar
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-slate-900">Ajustar Valores Orçados</h4>
                                <div className="flex gap-3">
                                    {totalChange !== 0 && (
                                        <div className={`px-4 py-2 rounded-xl ${totalChange >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                            <span className={`text-sm font-medium ${totalChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                Variação:
                                            </span>
                                            <span className={`text-lg font-bold ml-2 ${totalChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}
                                            </span>
                                        </div>
                                    )}
                                    {totalBudgeted !== 0 && (
                                        <div className={`px-4 py-2 rounded-xl ${totalBudgeted >= 0 ? 'bg-blue-50' : 'bg-rose-50'}`}>
                                            <span className={`text-sm font-medium ${totalBudgeted >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                                                Novo Total:
                                            </span>
                                            <span className={`text-lg font-bold ml-2 ${totalBudgeted >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                                {formatCurrency(totalBudgeted)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 max-h-96 overflow-y-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-slate-100">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Categoria</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Original</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Novo Valor</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Diferença</th>
                                            <th className="w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sheet.items.map((item) => {
                                            const original = initialAmounts[item.category_code] || 0;
                                            const current = getBudgetedAmount(item.category_code);
                                            const diff = current - original;

                                            return (
                                                <tr key={item.category_code} className="border-t border-slate-200">
                                                    <td className="py-3 px-4 text-sm text-slate-900">
                                                        <div className="font-medium">{item.category_name}</div>
                                                        <div className="text-xs text-slate-500">{item.category_code}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-right text-slate-600">
                                                        {formatCurrency(original)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="text"
                                                            value={inputValues[item.category_code] ?? (current === 0 ? '' : current.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                                                            onChange={(e) => handleAmountChange(item.category_code, e.target.value)}
                                                            onBlur={() => handleAmountBlur(item.category_code)}
                                                            className="w-full px-3 py-1.5 text-sm text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            placeholder="0,00"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-right">
                                                        {diff !== 0 && (
                                                            <span className={`font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            );
                                        })}

                                        {addedCategories.length > 0 && (
                                            <>
                                                <tr>
                                                    <td colSpan={5} className="py-2">
                                                        <div className="border-t-2 border-amber-300"></div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={5} className="py-2 px-4">
                                                        <div className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 inline-block">
                                                            Novas Categorias Adicionadas neste Aditivo
                                                        </div>
                                                    </td>
                                                </tr>
                                                {addedCategories.map((category) => {
                                                    const current = getBudgetedAmount(category.code);

                                                    return (
                                                        <tr key={category.code} className="border-t border-slate-200 bg-amber-50/30">
                                                            <td className="py-3 px-4 text-sm text-slate-900">
                                                                <div className="font-medium">{category.name}</div>
                                                                <div className="text-xs text-slate-500">{category.code}</div>
                                                            </td>
                                                            <td className="py-3 px-4 text-sm text-right text-slate-600">
                                                                <span className="text-amber-600 font-medium">NOVA</span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <input
                                                                    type="text"
                                                                    value={inputValues[category.code] ?? (current === 0 ? '' : current.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                                                                    onChange={(e) => handleAmountChange(category.code, e.target.value)}
                                                                    onBlur={() => handleAmountBlur(category.code)}
                                                                    className="w-full px-3 py-1.5 text-sm text-right border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                                                                    placeholder="0,00"
                                                                />
                                                            </td>
                                                            <td className="py-3 px-4 text-sm text-right">
                                                                <span className="font-semibold text-amber-600">
                                                                    +{formatCurrency(current)}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <button
                                                                    onClick={() => handleRemoveCategory(category.code)}
                                                                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                                                    title="Remover categoria"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !effectiveDate || !endDate}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Salvando...' : (existingAddendum ? 'Salvar Alterações' : 'Criar Aditivo')}
                    </button>
                </div>
            </div>
        </div>
    );
};

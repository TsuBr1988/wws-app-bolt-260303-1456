
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { CoaNode, ClientMetadata } from '../../../types';
import { formatCurrency } from '../../../utils';

interface CreateSheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        client_name: string;
        start_date: string;
        end_date: string;
        items: Array<{ category_code: string; category_name: string; budgeted_amount: number }>;
    }) => void;
    availableClients: string[];
    clientMetadata: Record<string, ClientMetadata>;
    chartOfAccountsTree: CoaNode[];
}

const CreateSheetModal: React.FC<CreateSheetModalProps> = ({
    isOpen,
    onClose,
    onSave,
    availableClients,
    clientMetadata,
    chartOfAccountsTree
}) => {
    const [clientName, setClientName] = useState('');
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budgetedAmounts, setBudgetedAmounts] = useState<Record<string, number>>({});
    const [inputValues, setInputValues] = useState<Record<string, string>>({});
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '2', '3']));
    const dropdownRef = useRef<HTMLDivElement>(null);

    const clientOptions = useMemo(() => {
        return availableClients
            .filter(client => {
                const meta = clientMetadata[client];
                return meta && meta.category === 'client';
            })
            .sort();
    }, [availableClients, clientMetadata]);

    const filteredClients = useMemo(() => {
        if (!clientSearchTerm) return clientOptions;
        return clientOptions.filter(client =>
            client.toLowerCase().includes(clientSearchTerm.toLowerCase())
        );
    }, [clientOptions, clientSearchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowClientDropdown(false);
            }
        };

        if (showClientDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showClientDropdown]);

    if (!isOpen) return null;

    const handleClientSelect = (client: string) => {
        setClientName(client);
        setClientSearchTerm(client);
        setShowClientDropdown(false);
    };

    const handleClientInputChange = (value: string) => {
        setClientSearchTerm(value);
        setClientName(value);
        setShowClientDropdown(true);
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
        }
    };

    const toggleNode = (code: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(code)) {
                next.delete(code);
            } else {
                next.add(code);
            }
            return next;
        });
    };

    const handleSave = () => {
        if (!clientName || !startDate || !endDate) {
            alert('Por favor, preencha o cliente, data de início e data de término.');
            return;
        }

        if (endDate < startDate) {
            alert('A data de término deve ser posterior à data de início.');
            return;
        }

        const items = Object.entries(budgetedAmounts)
            .filter(([_, amount]) => amount !== 0)
            .map(([code, amount]) => {
                const findNodeName = (nodes: CoaNode[], targetCode: string): string => {
                    for (const node of nodes) {
                        if (node.code === targetCode) return node.name;
                        if (node.children.length > 0) {
                            const found = findNodeName(node.children, targetCode);
                            if (found) return found;
                        }
                    }
                    return targetCode;
                };

                return {
                    category_code: code,
                    category_name: findNodeName(chartOfAccountsTree, code),
                    budgeted_amount: amount
                };
            });

        onSave({
            client_name: clientName,
            start_date: startDate,
            end_date: endDate,
            items
        });

        setClientName('');
        setClientSearchTerm('');
        setStartDate('');
        setEndDate('');
        setBudgetedAmounts({});
        setInputValues({});
    };

    const renderCoaTree = (nodes: CoaNode[], level: number = 0) => {
        return nodes.map(node => {
            const isExpanded = expandedNodes.has(node.code);
            const hasChildren = node.children && node.children.length > 0;
            const displayValue = inputValues[node.code] || '';

            return (
                <div key={node.code} className="flex flex-col">
                    <div
                        className="flex items-center py-2 px-3 hover:bg-slate-50 rounded-lg transition-colors"
                        style={{ paddingLeft: `${level * 20 + 12}px` }}
                    >
                        {hasChildren ? (
                            <button
                                onClick={() => toggleNode(node.code)}
                                className="p-1 mr-2 text-slate-400 hover:text-slate-600"
                            >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                        ) : (
                            <div className="w-6 mr-2" />
                        )}

                        <div className="flex-1 flex items-center justify-between gap-4">
                            <span className={`text-sm ${level === 0 ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                                {node.name}
                            </span>

                            {node.isLeaf && (
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                                    <input
                                        type="text"
                                        value={displayValue}
                                        onChange={(e) => handleAmountChange(node.code, e.target.value)}
                                        onBlur={() => handleAmountBlur(node.code)}
                                        placeholder="0,00"
                                        className="w-40 pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {isExpanded && hasChildren && (
                        <div>
                            {renderCoaTree(node.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    const totalBudgeted = Object.values(budgetedAmounts).reduce((sum, val) => sum + val, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">

                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-3xl">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">Nova Ficha de Contrato</h3>
                        <p className="text-sm text-slate-500 mt-1">Defina o orçamento por categoria para o cliente</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="space-y-6 mb-8">
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Cliente *</label>
                            <input
                                type="text"
                                value={clientSearchTerm}
                                onChange={(e) => handleClientInputChange(e.target.value)}
                                onFocus={() => setShowClientDropdown(true)}
                                placeholder="Digite para buscar um cliente"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300"
                            />
                            {showClientDropdown && filteredClients.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {filteredClients.map(client => (
                                        <button
                                            key={client}
                                            onClick={() => handleClientSelect(client)}
                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors text-slate-900 first:rounded-t-xl last:rounded-b-xl"
                                        >
                                            {client}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Data de Início *</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Data de Término *</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-slate-900">Valores Orçados por Categoria</h4>
                            {totalBudgeted !== 0 && (
                                <div className={`px-4 py-2 rounded-xl ${totalBudgeted >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                    <span className={`text-sm font-medium ${totalBudgeted >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Total: </span>
                                    <span className={`text-lg font-bold ${totalBudgeted >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(totalBudgeted)}</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 max-h-96 overflow-y-auto custom-scrollbar">
                            {renderCoaTree(chartOfAccountsTree)}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 rounded-b-3xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Salvar Ficha
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateSheetModal;
